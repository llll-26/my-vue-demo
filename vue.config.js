module.exports = {
  devServer: {
    open: true,
    port: 8081,
    proxy: {
      '/prod-api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/prod-api': ''
        }
      },
      '/profile': {
        target: 'http://localhost:8080',
        changeOrigin: true
        // 注意：没有 pathRewrite！
      },
      // WebSocket 代理配置
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,  // 启用 WebSocket 代理
        changeOrigin: true
      }
    }
  }
}