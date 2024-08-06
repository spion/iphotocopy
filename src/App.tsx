import { IonApp, IonRoute, IonRouter, IonRouterOutlet, setupIonicSolid } from "@ionic-solidjs/core"
import type { AppModel } from "./model/app"
import { MainPage } from "./pages/Main"

setupIonicSolid({
  mode: "ios",
})

export function App(props: { model: AppModel }) {
  console.log("Re rendering app")
  return (
    <IonApp
      style={{
        "--ion-font-family":
          "-apple-system, BlinkMacSystemFont, Roboto, SF UI Text, Verdana, Arial, sans-serif",
      }}
    >
      <IonRouter>
        <IonRoute url="/" component={MainPage} componentProps={props} />
      </IonRouter>
      <IonRouterOutlet />
    </IonApp>
  )
}
