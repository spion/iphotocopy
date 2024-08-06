import {
  IonAlert,
  IonBreadcrumb,
  IonBreadcrumbs,
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPopover,
  IonTitle,
  IonToolbar,
  useRouter,
} from "@ionic-solidjs/core"
import {
  iconAddCircleOutline,
  iconAlertCircleOutline,
  iconArrowBack,
  iconCheckmarkDoneCircleOutline,
  iconCheckmarkDoneOutline,
  iconCloudUploadOutline,
  iconFolderOpen,
  iconHourglassOutline,
  iconRefreshOutline,
  iconStopCircleOutline,
} from "@ionic-solidjs/ionicons"
import { For, Match, Show, Switch, createSignal } from "solid-js"
import { AppModel } from "../model/app"
import { iconFolder } from "@ionic-solidjs/ionicons"
import { PromiseSwitch } from "../components/PromiseSwitch"
import { text } from "express"
import { Browser, DirectoryEntry } from "../model/browser"
import { Uploader } from "../model/uploader"

const PhotoThumbnailSize = "calc(min(33vw, 33vh) - 10px)"

function BrowsePage(props: { model: Browser; startUpload: () => void }) {
  let modal: HTMLIonModalElement
  let dirName: HTMLIonInputElement

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{props.model.currentDirName}</IonTitle>
          <IonButtons slot="secondary">
            <Show when={props.model.currentPath}>
              <IonButton onClick={() => props.model.cd("..")}>
                <IonIcon slot="icon-only" name={iconArrowBack} />
              </IonButton>
            </Show>
          </IonButtons>
          <IonButtons slot="primary">
            <IonButton onClick={() => props.startUpload()}>
              <IonIcon slot="icon-only" name={iconAddCircleOutline} />
            </IonButton>
            <IonButton id="create-directory">
              <IonIcon slot="icon-only" name={iconFolder} />
            </IonButton>
            <IonModal ref={modal} style={{ height: "100%" }} trigger="create-directory">
              <IonHeader>
                <IonToolbar>
                  <IonButtons slot="start">
                    <IonButton onClick={() => modal.dismiss()}>Cancel</IonButton>
                  </IonButtons>
                  <IonTitle>Create folder</IonTitle>
                  <IonButtons slot="end">
                    <IonButton
                      strong={true}
                      onClick={() => {
                        if (dirName.value) {
                          props.model.mkdirp(dirName.value as string)
                          modal.dismiss()
                        }
                      }}
                    >
                      Create
                    </IonButton>
                  </IonButtons>
                </IonToolbar>
              </IonHeader>
              <IonContent class="ion-padding">
                <IonItem>
                  <IonInput
                    label="Enter folder name"
                    labelPlacement="stacked"
                    ref={dirName}
                    type="text"
                    placeholder="photos"
                  />
                </IonItem>
              </IonContent>
            </IonModal>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PromiseSwitch
          promise={props.model.fileList}
          rejected={e => <p class="ion-padding">Error loading files: {String(e)}</p>}
          pending={() => <p class="ion-padding">Loading...</p>}
          fulfilled={list => (
            <ion-grid>
              <ion-row>
                <For each={list.filter(itm => itm.isDirectory)}>
                  {item => (
                    <ion-col size-xs="4" size-sm="3" size-md="2">
                      <Directory name={item.name} model={props.model}></Directory>
                    </ion-col>
                  )}
                </For>
                <For
                  each={list.filter(itm => !itm.isDirectory && itm.name.match(/(png|jpg|jpeg)$/i))}
                >
                  {item => (
                    <ion-col size-xs="4" size-sm="3" size-md="2">
                      <Picture item={item} model={props.model} />
                    </ion-col>
                  )}
                </For>
              </ion-row>
            </ion-grid>
          )}
        />
      </IonContent>
    </>
  )
}

function Picture(props: { item: DirectoryEntry; model: Browser }) {
  return (
    <div class="photo-container" style={{ width: PhotoThumbnailSize, height: PhotoThumbnailSize }}>
      <img loading="lazy" src={props.item.thumbnailUrl} />
    </div>
  )
}

function StatusIcon(props: { status: string; slot: string }) {
  return (
    <Switch>
      <Match when={props.status === "pending"}>
        <IonIcon slot={props.slot} icon={iconHourglassOutline} />
      </Match>
      <Match when={props.status === "uploading"}>
        <IonIcon slot={props.slot} color="primary" icon={iconCloudUploadOutline} />
      </Match>
      <Match when={props.status === "uploaded"}>
        <IonIcon slot={props.slot} color="success" icon={iconCheckmarkDoneCircleOutline} />
      </Match>
      <Match when={props.status === "cancelled"}>
        <IonIcon slot={props.slot} color="warning" icon={iconAlertCircleOutline} />
      </Match>
      <Match when={props.status === "error"}>
        <IonIcon slot={props.slot} color="danger" icon={iconAlertCircleOutline} />
      </Match>
    </Switch>
  )
}

function Directory(props: { name: string; model: Browser }) {
  return (
    <IonCard
      style={{
        margin: "0px",
        padding: "0px",
        width: PhotoThumbnailSize,
        height: PhotoThumbnailSize,
      }}
      button
      onclick={() => {
        props.model.cd(props.name)
      }}
    >
      <ion-card-content
        style={{
          padding: "7px",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
        }}
      >
        <ion-text>
          <IonIcon size="large" name={iconFolderOpen}></IonIcon>
        </ion-text>
        <ion-text style={{ "font-size": "0.8rem" }}>{props.name}</ion-text>
      </ion-card-content>
    </IonCard>
  )
}

function UploadPage(props: { model: Uploader; browse: () => void }) {
  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{props.model.uploadPath}</IonTitle>
          <IonButtons slot="secondary">
            <Show when={props.model.isUploadInProgress}>
              <IonButton id="cancel-upload-go-back">
                <IonIcon slot="icon-only" name={iconStopCircleOutline} />
              </IonButton>
              <IonAlert
                trigger="cancel-upload-go-back"
                header="Upload in progress"
                message="Are you sure you want to cancel the upload?"
                buttons={[
                  {
                    text: "Cancel upload",
                    handler: () => {
                      props.model.cancelUpload()
                      props.browse()
                    },
                  },
                  {
                    text: "Continue upload",
                    handler: () => {},
                  },
                ]}
              ></IonAlert>
            </Show>
            <Show when={!props.model.isUploadInProgress}>
              <IonButton onClick={() => props.browse()}>
                <IonIcon slot="icon-only" name={iconArrowBack} />
              </IonButton>
            </Show>
          </IonButtons>
          <IonButtons slot="primary">
            <Show when={props.model.isUploadFinishedWithFailures}>
              <IonButton onClick={() => props.model.retryFailedUploads()}>
                <IonIcon slot="icon-only" name={iconRefreshOutline} />
              </IonButton>
            </Show>
            <Show when={!props.model.isUploadInProgress}>
              <IonButton onClick={() => props.model.uploadFiles()}>
                <IonIcon slot="icon-only" name={iconAddCircleOutline} />
              </IonButton>
            </Show>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <For each={props.model.filesToUpload}>
            {entry => (
              <IonItem>
                <StatusIcon status={entry.status} slot="start" />
                <IonLabel>{entry.file.name}</IonLabel>
                <Show when={entry.statusText}>
                  <IonNote>{entry.statusText}</IonNote>
                </Show>
                <IonLabel slot="end">
                  {/* See https://github.com/ionic-solidjs/ionic-solidjs/issues/33 */}
                  <span>{entry.status}</span>
                </IonLabel>
              </IonItem>
            )}
          </For>
        </IonList>
      </IonContent>
    </>
  )
}

export function MainPage(props: { model: AppModel }) {
  return (
    <Switch>
      <Match when={props.model.currentMode === "browse"}>
        <BrowsePage model={props.model.browser} startUpload={() => props.model.startUploader()} />
      </Match>
      <Match when={props.model.currentMode === "upload"}>
        <UploadPage model={props.model.uploader} browse={() => props.model.startBrowser()} />
      </Match>
    </Switch>
  )
}
