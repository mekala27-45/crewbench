import {defineConfig} from 'vite';
export default defineConfig({root:'site',base:'/crewbench/',build:{outDir:'../dist',emptyOutDir:true},server:{host:'127.0.0.1',port:5173}});
