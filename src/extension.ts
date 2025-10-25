// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "colors" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "colors.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from 	colors!");
    }
  );

  context.subscriptions.push(disposable);

  // --- MCP server: spawn the helper process if available ---
  let mcpProcess: cp.ChildProcessWithoutNullStreams | undefined;
  // simple pending RPC map
  const pending = new Map<
    number,
    { resolve: (v: any) => void; reject: (e: any) => void }
  >();
  let nextId = 1;

  try {
    const mcpServerPath = path.join(
      context.extensionPath,
      "dist",
      "mcp",
      "server.js"
    );
    if (fs.existsSync(mcpServerPath)) {
      mcpProcess = cp.spawn(process.execPath, [mcpServerPath], {
        stdio: "pipe",
      });

      // accumulate stdout and parse Content-Length framed JSON-RPC responses
      let stdoutBuf = Buffer.alloc(0);
      mcpProcess.stdout.on("data", (d: Buffer) => {
        stdoutBuf = Buffer.concat([stdoutBuf, d]);

        // try to parse one or more messages
        while (true) {
          const headerEnd = stdoutBuf.indexOf("\r\n\r\n");
          if (headerEnd === -1) {
            break;
          }
          const header = stdoutBuf.slice(0, headerEnd).toString();
          const m = header.match(/Content-Length: (\d+)/i);
          if (!m) {
            // malformed header; drop
            stdoutBuf = stdoutBuf.slice(headerEnd + 4);
            continue;
          }
          const len = parseInt(m[1], 10);
          const totalLen = headerEnd + 4 + len;
          if (stdoutBuf.length < totalLen) {
            // wait for body
            break;
          }
          const bodyBuf = stdoutBuf.slice(headerEnd + 4, totalLen);
          const bodyStr = bodyBuf.toString();
          try {
            const msg = JSON.parse(bodyStr);
            if (msg.id && pending.has(msg.id)) {
              const p = pending.get(msg.id)!;
              if (msg.error) {
                p.reject(msg.error);
              } else {
                p.resolve(msg.result);
              }
              pending.delete(msg.id);
            } else {
              console.log("MCP unsolicited message:", msg);
            }
          } catch (e) {
            console.error("Failed to parse MCP JSON-RPC body:", e, bodyStr);
          }
          stdoutBuf = stdoutBuf.slice(totalLen);
        }
      });

      mcpProcess.stderr?.on("data", (d) =>
        console.error(`[mcp stderr] ${d.toString()}`)
      );

      mcpProcess.on("exit", (code, signal) => {
        console.log(`MCP server exited (code=${code}, signal=${signal})`);
      });

      // ensure we stop the process when extension deactivates
      context.subscriptions.push({
        dispose: () => {
          try {
            mcpProcess?.kill();
          } catch (e) {
            console.error("Failed to kill MCP server process", e);
          }
        },
      });
    } else {
      console.warn(
        "MCP server not found at",
        mcpServerPath,
        "\nRun `npm run build:mcp` to build it."
      );
    }
  } catch (err) {
    console.error("Error launching MCP server:", err);
  }

  // helper to send a single JSON-RPC request and await response
  function sendRpcRequest(method: string, params: any) {
    return new Promise<any>((resolve, reject) => {
      if (!mcpProcess || !mcpProcess.stdin.writable) {
        return reject(new Error("MCP server is not running"));
      }
      const id = nextId++;
      const req = { jsonrpc: "2.0", id, method, params };
      const body = JSON.stringify(req);
      const header = `Content-Length: ${Buffer.byteLength(
        body,
        "utf8"
      )}\r\n\r\n`;
      pending.set(id, { resolve, reject });
      try {
        mcpProcess.stdin.write(header);
        mcpProcess.stdin.write(body);
      } catch (e) {
        pending.delete(id);
        reject(e);
      }
      // timeout after 10s
      const to = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error("MCP request timed out"));
        }
      }, 10000);
      // wrap resolve/reject to clear timeout
      const origResolve = resolve;
      const origReject = reject;
      pending.set(id, {
        resolve: (v: any) => {
          clearTimeout(to);
          origResolve(v);
        },
        reject: (e: any) => {
          clearTimeout(to);
          origReject(e);
        },
      });
    });
  }

  // register a command that asks the MCP server to generate a palette and opens it
  const genDisposable = vscode.commands.registerCommand(
    "colors.generatePalette",
    async () => {
      try {
        const params = { seed: "#3466f2", shades: 9 };
        const result = await sendRpcRequest("generatePalette", params);
        const contentArr: string[] = [];
        if (result && result.content && Array.isArray(result.content)) {
          for (const seg of result.content) {
            if (seg.type === "text" && typeof seg.text === "string") {
              contentArr.push(seg.text);
            }
          }
        }
        const full = contentArr.join("");
        const doc = await vscode.workspace.openTextDocument({
          content: full,
          language: "css",
        });
        await vscode.window.showTextDocument(doc, { preview: false });
      } catch (e: any) {
        vscode.window.showErrorMessage(
          `Generate palette failed: ${e?.message || e}`
        );
      }
    }
  );
  context.subscriptions.push(genDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  // VS Code will call disposables pushed into context.subscriptions; nothing else required here.
}
