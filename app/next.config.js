/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  // CloudBase Web 应用托管需要静态资源在根路径
  assetPrefix: ".",
  trailingSlash: true,
  // 允许 CloudBase 的环境变量
  env: {
    FEISHU_APP_ID: process.env.FEISHU_APP_ID,
    FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET,
    FEISHU_APP_TOKEN: process.env.FEISHU_APP_TOKEN,
    FEISHU_TABLE_ID: process.env.FEISHU_TABLE_ID,
    FIELD_BRAND: process.env.FIELD_BRAND,
    FIELD_GMV: process.env.FIELD_GMV,
    FIELD_TIME: process.env.FIELD_TIME,
  },
};

module.exports = nextConfig;
