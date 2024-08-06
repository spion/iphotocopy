import { Reaction, untracked } from 'mobx'
import { enableExternalSource } from 'solid-js'

let id = 0
console.log('Installing mobx integration')
enableExternalSource((fn, trigger) => {
  const reaction = new Reaction(`externalSource@${++id}`, trigger)
  return {
    track: x => {
      let next
      reaction.track(() => (next = fn(x)))
      return next
    },
    dispose: () => {
      reaction.dispose()
    },
  }
}, untracked)
