{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.chromium
    pkgs.nss
    pkgs.freetype
    pkgs.harfbuzz
    pkgs.fontconfig
    pkgs.glib
    pkgs.wget
  ];
}
