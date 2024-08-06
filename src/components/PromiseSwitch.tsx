import { IPromiseBasedObservable } from "mobx-utils"
import { Show } from "solid-js"

export function PromiseSwitch<T>(props: {
  promise: IPromiseBasedObservable<T>
  fulfilled: (val: T) => any
  rejected: (e: Error) => any
  pending: (val?: T) => any
}) {
  let res = () => {
    switch (props.promise.state) {
      case "fulfilled":
        return props.fulfilled(props.promise.value)
      case "rejected":
        return props.rejected(props.promise.value as any as Error)
      case "pending":
        return props.pending(props.promise.value)
    }
  }
  return <Show when={props.promise.state != null}>{res()}</Show>
}
