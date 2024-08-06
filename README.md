## iphotocopy

Copy photos from your phone to your PC without a cloud in the middle


## quickstart

Clone the repo and then run the following commands:

```bash
npm install
mkdir -p "$HOME/Photos/iphotocopy"
export BASE_DIRECTORY="$HOME/Photos/iphotocopy"
npm run dev
```

This will make the directory `$HOME/Photos/iphotocopy` accessible on your local network, ready
to accept photo uploads.

To upload photos to this directory, copy the `Network:` link reported by Vite (e.g.
http://192.168.1.10:3000) and open it on your phone.