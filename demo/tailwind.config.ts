import type { Config } from "tailwindcss";
const config:Config={content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],theme:{extend:{colors:{"brand-navy":"#0B2340","brand-teal":"#12AAA5","brand-bg":"#F4F8F8"},boxShadow:{card:"0 18px 45px rgba(11,35,64,.09)",soft:"0 8px 24px rgba(11,35,64,.10)"}}},plugins:[]};export default config;
