{ system ? builtins.currentSystem
, version ? "latest"
, rev ? ""
, commitTime ? "1970-01-01T00:00:00+00:00"
, repoUrl ? ""
}:

let
  nixpkgs = builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/51df9074f00d449bad44c08d81847a06c6d9ec97.tar.gz";
    sha256 = "1kh61br24002m7kn3kk6wipw3mf80d8cm5qqdxp9awm3kdrasix9";
  };
  pkgs = import nixpkgs { inherit system; };

  devshell = import
    (pkgs.fetchFromGitHub {
      owner = "numtide";
      repo = "devshell";
      rev = "4b5ac7cf7d9a1cc60b965bb51b59922f2210cbc7";
      sha256 = "0yap206lryymsgihjdp7rajlcar2374c2qcc1bvq5czwbfzlz4r2";
    })
    { inherit pkgs; };

  protoc-gen-grpc-web = pkgs.stdenv.mkDerivation rec {
    pname = "protoc-gen-grpc-web";
    version = "1.2.1";

    src = pkgs.fetchFromGitHub {
      owner = "grpc";
      repo = "grpc-web";
      rev = version;
      sha256 = "1g00s0d72nnwf6jn9n4qa6ywb2zdk4kx8cyfld7w6frmrp4hs49l";
    };

    doCheck = true;
    buildInputs = with pkgs; [ protobuf ];

    buildPhase = ''
      make plugin
    '';

    installPhase = ''
      mkdir -p $out/bin
      cd javascript/net/grpc/web
      install protoc-gen-grpc-web $out/bin
    '';
  };

  protogen_path_js = "src/gen/googleapis/google/rpc";
  types_path_js = "src/gen/types";
  index_path_js = "src/index.ts";

  buf-gen-config = {
    version = "v1";
    managed = {
      enabled = true;
    };
    plugins = [
      {
        name = "grpc-web";
        out = protogen_path_js;
        opt = "import_style=typescript,mode=grpcwebtext";
      }
      {
        name = "js";
        out = protogen_path_js;
        opt = "import_style=commonjs,binary";
      }
    ];
  };

  nodejs = pkgs.nodejs-16_x;

  go = pkgs.go_1_16;
in
{
  shell = devshell.mkShell {
    devshell = {
      name = "yp-demo-tool";
      packages = [
        go
        nodejs

        pkgs.buf
        pkgs.protobuf
        pkgs.protoc-gen-go
        pkgs.protoc-gen-go-grpc
        protoc-gen-grpc-web

        pkgs.golangci-lint

        # keep pinned nixpkgs so they are not garbage collected
        pkgs.path
      ];
    };

    commands = [
      {
        name = "lint";
        help = "run golangci-lint and npm run check";
        command = ''
          npm run check
        '';
      }
      {
        name = "fmt";
        help = "Format and fix found issues";
        command = ''
          npm run fix
        '';
      }
      {
        name = "generate";
        help = "Generates protobuf definitions";
        command = ''
          clean
          buf generate --template '${builtins.toJSON buf-gen-config}' ./googleapis/google/rpc
          npm run generate -- --types-path "${types_path_js}" --index-path "${index_path_js}" --proto-path "${protogen_path_js}"
        '';
      }
      {
        name = "clean";
        help = "Removes files generated by proto-gen";
        command = ''
          rm -rf "$DEVSHELL_ROOT/${protogen_path_js}"
          rm -rf "$DEVSHELL_ROOT/${types_path_js}"
          rm -f "$DEVSHELL_ROOT/${index_path_js}"
        '';
      }
    ];
  };
}
