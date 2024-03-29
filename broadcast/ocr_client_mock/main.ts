// Data and original script courtesy of @jshimada3256 (X)
import { TextLineStream } from "https://deno.land/std@0.141.0/streams/mod.ts";

if (import.meta.main) {
  // コマンドライン引数からファイル名とWebSocketサーバのアドレスを取得
  const serverAddress = Deno.args[0];
  const fileName = Deno.args[1];
  const rate = parseInt(Deno.args[2] || "15");
  const speed = parseInt(Deno.args[3] || "1");

  if (!fileName || !serverAddress) {
    throw new Error(
      "Usage: node client.js <server_address> <file_name> [rate=15] [speed=1]",
    );
  }

  // 何行目を読んでいるか
  let current = 0;
  const incr = 60 * speed / rate;

  // WebSocketクライアントを作成
  const ws = new WebSocket(serverAddress);

  // WebSocket接続が確立されたときの処理
  ws.onopen = () => {
    console.log("Connected to server");
  };

  // サーバーからメッセージを受信したときの処理
  ws.onmessage = (ev) => {
    const j = JSON.parse(ev.data);
    if (j.op === 1) {
      console.log("Received reset request, sending from first");
      current = 0;
    } else {
      console.log("Received unknown message from server:", ev.data);
    }
  };

  // WebSocket接続が閉じられたときの処理
  ws.onclose = () => {
    console.log("Disconnected from server");
    Deno.exit(0);
  };

  // gzip圧縮されたテキストファイルを解凍しバッファに保存
  const fileStream = await Deno.open(fileName, { read: true });
  const decompressionStream = new DecompressionStream("gzip");
  const textDecoderStream = new TextDecoderStream();
  const lineStream = new TextLineStream();
  fileStream.readable.pipeThrough(decompressionStream);
  decompressionStream.readable.pipeThrough(textDecoderStream);
  textDecoderStream.readable.pipeThrough(lineStream);

  const data: string[] = [];
  for await (const line of lineStream.readable) {
    if (line != "") {
      data.push(line);
    }
  }

  // 全部読み終わったので送信を開始
  setInterval(() => {
    const n = Math.floor(current);
    ws.send(data[n]);
    current += incr;
    // 末尾にたどりついた場合最終データをそのまま送り続ける
    if (current >= data.length - 1) {
      current = data.length - 1;
    }
  }, 1000 / rate);
}
