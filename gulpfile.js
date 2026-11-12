import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { Transform } from "node:stream";
import path from "node:path";
import gulp from "gulp";
import fileInclude from "gulp-file-include";
import postcss from "gulp-postcss";
import tailwind from "@tailwindcss/postcss";
import browserSync from "browser-sync";
import sharp from "sharp";
import * as esbuild from "esbuild";

const { src, dest, series, parallel, watch } = gulp;
const isProd = process.argv.includes("--production");
const server = browserSync.create();

const paths = {
  src: "src",
  dist: "dist",

  pages: "src/*.html",
  partials: "src/partials/**/*.html",
  styles: "src/styles/**/*.css",
  stylesEntry: "src/styles/main.css",
  js: "src/js/**/*.js",

  // icons/*.svg собираются в один спрайт assets/icons/sprite.svg (задача sprite)
  icons: "src/assets/icons",
  sprite: "dist/assets/icons/sprite.svg",
  // Узоры *-pattern.svg в dist не копируются: сборка растеризует их в AVIF/WebP (см. imagePlan)
  static: [
    "src/assets/{fonts,images}/**/*.{svg,woff2}",
    "src/assets/{favicons,og}/*",
    "!src/assets/images/**/*-pattern.svg",
  ],
  raster: "src/assets/images/**/*.{png,jpg,jpeg}",
};

const IMG_TAG = /<img\b[^>]*\bdata-widths="[^"]*"[^>]*>/g;
const QUALITY = { avif: 50, webp: 75, jpg: 80 };
const metaCache = new Map();
const imageJobs = new Map();

/*
  <img data-widths> может ссылаться и на SVG. Так подключены тяжёлые узоры
  из Figma (десятки масок и градиентов): браузер растеризует такой SVG на
  главном потоке при первом показе и при каждой перерисовке рядом, и прокрутка
  подвисает. Сборка заранее превращает его в картинки, SVG рендерится
  с плотностью SVG_SCALE, поэтому доступны ширины до SVG_SCALE × ширина макета.
*/
const SVG_SCALE = 2;
const openImage = (file) =>
  file.endsWith(".svg") ? sharp(file, { density: 72 * SVG_SCALE }) : sharp(file);

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

async function imagePlan(srcAttr, widthsAttr) {
  const file = path.join(paths.src, srcAttr);
  if (!metaCache.has(file)) {
    const image = openImage(file);
    const [{ width }, { isOpaque }] = await Promise.all([
      image.metadata(),
      image.stats(),
    ]);
    metaCache.set(file, { width, isOpaque });
  }
  const meta = metaCache.get(file);
  const widths = [
    ...new Set(
      widthsAttr.split(",").map((w) => Math.min(Number(w), meta.width)),
    ),
  ].sort((a, b) => a - b);
  const fallback = meta.isOpaque ? "jpg" : "png";
  const { dir, name } = path.posix.parse(srcAttr);
  const url = (w, ext) => `${dir}/${name}-${w}.${ext}`;
  return { file, widths, fallback, url };
}

async function renderPicture(tag) {
  const plan = await imagePlan(attr(tag, "src"), attr(tag, "data-widths"));
  const { widths, fallback, url } = plan;
  const job = imageJobs.get(plan.file) ?? { ...plan, widths: new Set() };
  widths.forEach((w) => job.widths.add(w));
  imageJobs.set(plan.file, job);

  const sizes = attr(tag, "sizes");
  const srcset = (ext) => widths.map((w) => `${url(w, ext)} ${w}w`).join(", ");
  const sizesAttr = sizes ? ` sizes="${sizes}"` : "";
  const img = tag
    .replace(/\s(src|data-widths|sizes)="[^"]*"/g, "")
    .replace(
      /^<img/,
      `<img src="${url(widths.at(-1), fallback)}" srcset="${srcset(fallback)}"${sizesAttr}`,
    );
  return (
    `<picture>` +
    `<source type="image/avif" srcset="${srcset("avif")}"${sizesAttr}>` +
    `<source type="image/webp" srcset="${srcset("webp")}"${sizesAttr}>` +
    `${img}</picture>`
  );
}
const devReload = () =>
  new Transform({
    objectMode: true,
    transform(file, _enc, done) {
      if (!isProd) {
        const html = file.contents.toString();
        file.contents = Buffer.from(
          html.replace(
            "</body>",
            '<script async src="/browser-sync/browser-sync-client.js"></script>\n</body>',
          ),
        );
      }
      done(null, file);
    },
  });

const pictures = () =>
  new Transform({
    objectMode: true,
    transform(file, _enc, done) {
      const html = file.contents.toString();
      const tags = html.match(IMG_TAG) ?? [];
      Promise.all(tags.map(renderPicture))
        .then((rendered) => {
          let i = 0;
          file.contents = Buffer.from(
            html.replace(IMG_TAG, () => rendered[i++]),
          );
          done(null, file);
        })
        .catch(done);
    },
  });

const isFresh = async (source, target) => {
  try {
    return (await stat(target)).mtimeMs >= (await stat(source)).mtimeMs;
  } catch {
    return false;
  }
};

export async function images() {
  const tasks = [];
  for (const { file, widths, fallback, url } of imageJobs.values()) {
    for (const w of widths) {
      for (const ext of ["avif", "webp", fallback]) {
        const target = path.join(paths.dist, url(w, ext));
        tasks.push(
          (async () => {
            if (await isFresh(file, target)) return;
            await mkdir(path.dirname(target), { recursive: true });
            const pipeline = openImage(file).resize({
              width: w,
              withoutEnlargement: true,
            });
            if (ext === "avif")
              await pipeline.avif({ quality: QUALITY.avif }).toFile(target);
            else if (ext === "webp")
              await pipeline.webp({ quality: QUALITY.webp }).toFile(target);
            else if (ext === "jpg")
              await pipeline
                .jpeg({ quality: QUALITY.jpg, mozjpeg: true })
                .toFile(target);
            else await pipeline.png({ compressionLevel: 9 }).toFile(target);
          })(),
        );
      }
    }
  }
  await Promise.all(tasks);
}

export const html = () => {
  imageJobs.clear();
  metaCache.clear();
  return src(paths.pages, { base: paths.src })
    .pipe(fileInclude({ prefix: "@@", basepath: "@root", indent: true }))
    .pipe(pictures())
    .pipe(devReload())
    .pipe(dest(paths.dist))
    .pipe(server.stream());
};

export const styles = () =>
  src(paths.stylesEntry, { base: paths.src })
    .pipe(
      postcss([
        tailwind({
          optimize: isProd ? { minify: true } : false,
          transformAssetUrls: false,
        }),
      ]).on("error", function onError(error) {
        if (isProd) throw error;
        console.error(error.message);
        this.emit("end");
      }),
    )
    .pipe(dest(paths.dist))
    .pipe(server.stream());

// esbuild собирает модули вместе с GSAP из node_modules в один main.js
// с source map: в DevTools код виден в исходном виде. В production бандл
// минифицируется, в разработке остаётся читаемым.
export const scripts = async () => {
  await esbuild.build({
    entryPoints: [path.join(paths.src, "js/main.js")],
    outfile: path.join(paths.dist, "js/main.js"),
    bundle: true,
    minify: isProd,
    sourcemap: true,
    format: "esm",
    target: "es2020",
  });
  if (server.active) server.reload();
};

/*
  SVG-спрайт: каждая иконка из src/assets/icons становится <symbol id="имя-файла">.
  В разметке иконка вызывается через components/icon.html:
  <svg><use href="assets/icons/sprite.svg#star"></use></svg>
  Размер задаёт CSS, цвет — currentColor.
*/
export async function sprite() {
  const files = (await readdir(paths.icons)).filter((f) => f.endsWith(".svg")).sort();
  const symbols = await Promise.all(
    files.map(async (file) => {
      const svg = (await readFile(path.join(paths.icons, file), "utf8")).trim();
      const viewBox = svg.match(/<svg\b[^>]*\bviewBox="([^"]+)"/)?.[1];
      if (!viewBox) throw new Error(`sprite: у ${file} нет viewBox`);
      const inner = svg.replace(/^<svg\b[^>]*>/, "").replace(/<\/svg>$/, "").trim();
      return `<symbol id="${path.parse(file).name}" viewBox="${viewBox}">${inner}</symbol>`;
    }),
  );
  await mkdir(path.dirname(paths.sprite), { recursive: true });
  await writeFile(
    paths.sprite,
    `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("\n")}\n</svg>\n`,
  );
  if (server.active) server.reload();
}

export const assets = () =>
  src(paths.static, { base: paths.src, encoding: false }).pipe(
    dest(paths.dist),
  );

export async function clean() {
  const entries = await readdir(paths.dist).catch(() => []);
  await Promise.all(
    entries.map((entry) =>
      rm(path.join(paths.dist, entry), { recursive: true, force: true }),
    ),
  );
}

function serve() {
  server.init({
    server: paths.dist,
    notify: false,
    open: false,
    port: 3000,
    snippet: false,
    snippetOptions: { blacklist: ["/", "/**"] },
  });

  watch(
    [paths.pages, paths.partials, paths.raster],
    series(html, images, styles),
  );
  watch(paths.styles, styles);
  watch(paths.js, scripts);
  watch(paths.static, assets).on("change", server.reload);
  watch(`${paths.icons}/*.svg`, sprite);
}

const compile = series(
  parallel(series(html, images), scripts, assets, sprite),
  styles,
);

export const build = series(clean, compile);

export default series(compile, serve);
