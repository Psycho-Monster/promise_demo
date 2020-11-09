// Promise实现
(function (window) {
  // Promise接收一个函数，该函数有两个参数，一个是resolve函数，一个是reject函数
  function Promise(executor) {
    const _this = this
    // 初始化status,data,回调函数队列
    _this.status = 'pending'
    _this.data = undefined
    _this.callbacks = []  // {onResolved,onRejected}
    // resolve函数
    function resolve(value) {
      if (_this.status !== 'pending') {
        return
      }
      _this.status = 'fulfilled'
      _this.data = value
      if (_this.callbacks.length) {
        _this.callbacks.forEach(callback => {
          callback.onResolved(value)
        })
      }
    }
    // reject函数
    function reject(reason) {
      if (_this.status !== 'pending') {
        return
      }
      _this.status = 'rejected'
      _this.data = reason
      if (_this.callbacks.length) {
        _this.callbacks.forEach(callback => {
          callback.onRejected(reason)
        })
      }
    }
    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }
  Promise.prototype.then = function (onResolved = value => value, onRejected = reason => { throw reason }) {
    // 保存this
    const _this = this
    return new Promise((resolve, reject) => {
      /* 
        根据回调函数执行的结果(result)来决定返回的promise的状态
        如果抛出错误，则reject(error)
        如果返回的不是promise类型的值，则resolve(result)
        如果返回的是promise类型的值，则返回的promise状态为该promise结果的状态
      */
      function handle(callback) {
        try {
          const result = callback(_this.data)
          if (result instanceof Promise) {
            result.then(resolve, reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }
      if (_this.status === 'pending') {
        _this.callbacks.push({
          onResolved() {
            handle(onResolved)
          },
          onRejected() {
            handle(onRejected)
          }
        })
      } else if (_this.status === 'fulfilled') {
        setTimeout(() => {
          handle(onResolved)
        });
      } else {
        setTimeout(() => {
          handle(onRejected)
        });
      }
    })
  }
  Promise.prototype.catch = function (onRejected) {
    this.then(undefined, onRejected)
  }
  Promise.prototype.finally = function (callback) {
    // 不管成功还是失败，都会走到finally中
    // 并且finally之后，还可以继续then。并且会将值原封不动的传递给后面的then。
    return this.then(
      value => Promise.resolve(callback()).then(() => value),
      reason => Promise.resolve(callback()).then(() => { throw reason })
    )
  }
  Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
      if (value instanceof Promise) {
        value.then(resolve, reject)
      } else {
        resolve(value)
      }
    })
  }
  Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }
  Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
      let result = []
      let count = 0
      let length = promises.length
      for (let i = 0; i < promises.length; i++) {
        const promise = array[i];
        Promise.resolve(promise).then((value) => {
          result.push(value)
          count++
          if (count === length) {
            resolve(result)
          }
        }, reason => {
          reject(reason)
          break
        })
      }
    })
  }
  Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i];
        Promise.resolve(promise).then(value => {
          resolve(value)
          break
        }, reason => {
          reject(reason)
          break
        })
      }
    })
  }
  Promise.allSettled = function (promises) {
    return new Promise((resolve) => {
      const result = []
      promises.forEach(promise => {
        Promise.resolve(promise).then(value => {
          result.push({
            status: 'fulfilled',
            value
          })
        }, reason => {
          result.push({
            status: 'rejected',
            reason
          })
        })
      })
      resolve(result)
    })
  }
  Promise.any = function (promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        const promise = promises[i];
        Promise.resolve(promise).then(value => {
          resolve(value)
          break
        })
      }
      reject('AggregateError: All promises were rejected')
    })
  }
  window.Promise = Promise
})(window)