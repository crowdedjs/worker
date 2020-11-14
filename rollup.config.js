import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default {
  input: './src/bootWorker.js',
  output: {
      file: './worker.js',
      format: 'iife',
      name: 'bootWorker'
  },
  plugins:[
    
      webWorkerLoader({
        pattern:/web-worker:(.+)/,
        sourcemap:true
      })
    
  ]
}
