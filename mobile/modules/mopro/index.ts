// Reexport the native module. On web, it will be resolved to MoproModule.web.ts
// and on native platforms to MoproModule.ts
export { default } from './src/MoproModule';
export { default as MoproView } from './src/MoproView';
export * from  './src/Mopro.types';
