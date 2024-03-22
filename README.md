# the-masters-scripts

## Overview

* backend -- 大会進行に関するAPIを提供
  * 8518 (HTTP) APIサーバー ← broadcast
* broadcast -- 大会進行ダッシュボード+配信画面
  * 8514 (HTTP) DenoCG assets ← ブラウザ・OBS
  * 8515 (WebSocket) DenoCG socket ← ブラウザ・OBS
  * 8517 (WebSocket) OCRサーバー ← OCRアプリ
  * 8519 (HTTP) user-server ← user-client
* user-client -- 参加登録用Webサーバー
  * 8520 (HTTP) サーバー ← ブラウザ
* spreadsheet-exporter -- 大会結果をスプレッドシートに書き出すプログラム
  * Apps Script (HTTP) ← backend
* fallback-timer -- フォールバック用タイマー（専用スプレッドシートと組み合わせる）
  * Apps Script (HTTP) ← ブラウザ
* launcher -- backend, broadcast, user-clientのランチャー
* common -- 複数のプロジェクトで共有されているコード

## Development

* Deno (Required)
* Visual Studio Code (Recommended)

各フォルダにdeno.jsonと.code-workspaceがあります。
