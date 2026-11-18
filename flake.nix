{
    description = "天の北極からの視点で地球の自転を観察するWebアプリの開発環境";

    inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    outputs = { nixpkgs, ... }:
        let
            # Apple Silicon Mac向けのパッケージを使います。
            system = "aarch64-darwin";
            pkgs = import nixpkgs { inherit system; };
            devPackages = import ./packages.nix { inherit pkgs; };
            # 各パッケージの代表コマンド名を使い、確認対象も一覧に合わせます。
            toolCommands = builtins.map
                (package: package.meta.mainProgram or (pkgs.lib.getName package))
                devPackages;
        in
        {
            devShells.${system}.default = pkgs.mkShell {
                packages = devPackages;

                shellHook = ''
                    # 初回だけ、このフォルダにGitリポジトリを作成します。
                    if [ ! -e .git ]; then
                        git init --initial-branch=main

                        # 次回もNixから設定を読み込めるようにします。
                        git add -- flake.nix packages.nix
                        if [ -f flake.lock ]; then
                            git add -- flake.lock
                        fi
                    fi

                    # このリポジトリだけに適用するGitの設定です。
                    git config --local core.hooksPath .githooks
                    git config --local pull.ff only
                    git config --local --unset-all credential.https://github.com.helper 2>/dev/null || true
                    git config --local --add credential.https://github.com.helper ""
                    git config --local --add credential.https://github.com.helper '!gh auth git-credential'

                    # 各ツールがNixから提供されているか表示します。
                    echo "Development tools:"
                    # npmはNode.jsに付属するため、代表コマンドとは別に確認します。
                    for tool in ${pkgs.lib.escapeShellArgs toolCommands} npm; do
                        tool_path="$(command -v "$tool" 2>/dev/null || true)"

                        case "$tool_path" in
                            /nix/store/*) source_label="nix/store" ;;
                            "") source_label="not found" ;;
                            *) source_label="outside nix/store" ;;
                        esac

                        printf '  %-9s %s (%s)\n' "$tool" "$tool_path" "$source_label"
                    done
                '';
            };
        };
}
