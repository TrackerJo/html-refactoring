import * as vscode from "vscode";

import { getNonce } from "./getNonce";
import { GlobalStorageService } from "./storage";
import { Attribute, refactor } from "./extension";


export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _storage: GlobalStorageService;


  constructor(private readonly _extensionUri: vscode.Uri, storage: GlobalStorageService) {
    this._storage = storage;

  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    function generateId(){
      //Generate a random id with 16 characters with a mix of numbers and letters
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }


    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "add-class-prompt": {
          const className = await vscode.window.showInputBox({
            prompt: "Enter the class name",
          });
          if (!className) {
            return;
          }
          let classDescription = await vscode.window.showInputBox({
            prompt: "Enter the class description",
          });
          if (!classDescription) {
            classDescription = "";
          }
          const projectName = vscode.workspace.name;
          const classId = generateId();
          
          const classes: Object[] = this._storage.getValue(projectName + "-classes") || [];
          classes.push({name: className, id: classId, references: [], description: classDescription});
          this._storage.setValue(projectName + "-classes", classes);
          webviewView.webview.postMessage({type: "update-classes", classes: classes});
          break;
        }
        case "add-id-prompt": {
          const idName = await vscode.window.showInputBox({
            prompt: "Enter the id name",
          });
          if (!idName) {
            return;
          }
          let idDescription = await vscode.window.showInputBox({
            prompt: "Enter the id description",
          });
          if (!idDescription) {
            idDescription = "";
          }
          const projectName = vscode.workspace.name;
          const idId = generateId();
          
          const ids: Object[] = this._storage.getValue(projectName + "-ids") || [];
          ids.push({name: idName, id: idId, references: [], description: idDescription});
          this._storage.setValue(projectName + "-ids", ids);
          webviewView.webview.postMessage({type: "update-ids", ids: ids});
          break;
        }

        case "save-classes": {
          const projectName = vscode.workspace.name;
          this._storage.setValue(projectName + "-classes", data.classes);
          break;
        }

        case "save-ids": {
          const projectName = vscode.workspace.name;
          this._storage.setValue(projectName + "-ids", data.ids);
          break;
        }

        case "get-classes": {
          const projectName = vscode.workspace.name;
          const classes: Object[] = this._storage.getValue(projectName + "-classes") || [];
          webviewView.webview.postMessage({type: "update-classes", classes: classes});
          break;
        }

        case "get-ids": {
          const projectName = vscode.workspace.name;
          const ids: Object[] = this._storage.getValue(projectName + "-ids") || [];
          webviewView.webview.postMessage({type: "update-ids", ids: ids});
          break;
        }

        case "edit-class-prompt": {
          const projectName = vscode.workspace.name;
          const choice = await vscode.window.showQuickPick(["Name", "Description"], {placeHolder: "Which would you like to edit?"});
          if (!choice) {
            vscode.window.showErrorMessage("No choice selected");
            return;
          }
          if (choice === "Name") {
            const idIndex = data.index;
            const className = await vscode.window.showInputBox({
              prompt: "Enter the new class name",
            });
            if (!className) {
              return;
            }
            const classes: Attribute[] = this._storage.getValue(projectName + "-classes") || [];
            const newClass = await refactor(classes[idIndex], className);
            classes[idIndex] = newClass;
            this._storage.setValue(projectName + "-classes", classes);
            webviewView.webview.postMessage({type: "update-classes", classes: classes});
          } else if (choice === "Description") {
            const idIndex = data.index;
            const classDescription = await vscode.window.showInputBox({
              prompt: "Enter the new class description",

            });
            if (!classDescription) {
              return;
            }
            const classes: Attribute[] = this._storage.getValue(projectName + "-classes") || [];
            classes[idIndex].description = classDescription;
            this._storage.setValue(projectName + "-classes", classes);
            webviewView.webview.postMessage({type: "update-classes", classes: classes});
          }

        break;
      }
      case "edit-id-prompt": {
        const projectName = vscode.workspace.name;
        const choice = await vscode.window.showQuickPick(["Name", "Description"], {placeHolder: "Which would you like to edit?"});
        if (!choice) {
          vscode.window.showErrorMessage("No choice selected");
          return;
        }
        if (choice === "Name") {
          const idIndex = data.index;
          const idName = await vscode.window.showInputBox({
            prompt: "Enter the new id name",
          });
          if (!idName) {
            return;
          }
          const ids: Attribute[] = this._storage.getValue(projectName + "-ids") || [];
          const newId = await refactor(ids[idIndex], idName);
          ids[idIndex] = newId;
          this._storage.setValue(projectName + "-ids", ids);
          webviewView.webview.postMessage({type: "update-ids", ids: ids});
        } else if (choice === "Description") {
          const idIndex = data.index;
          const idDescription = await vscode.window.showInputBox({
            prompt: "Enter the new id description",

          });
          if (!idDescription) {
            return;
          }
          const ids: Attribute[] = this._storage.getValue(projectName + "-ids") || [];
          ids[idIndex].description = idDescription;
          this._storage.setValue(projectName + "-ids", ids);
          webviewView.webview.postMessage({type: "update-ids", ids: ids});
        }

      break;
    }
    case "get-project-name": {
      webviewView.webview.postMessage({type: "update-project-name", projectName: vscode.workspace.name});
      break;
    }
    case "open-file": {
      vscode.commands.executeCommand("html-refactoring.openReference", {filePath: data.filePath, line: data.line, start: data.start, end: data.end});
      break;
    }
  }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
      );
    const mainScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
   
    const styleCodeToDoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

    

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
			
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <link href="${styleCodeToDoUri}" rel="stylesheet">

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
        </script>
       
			</head>
      <body>
       <div class="window">
            
            <div class="pane vertical classes-pane active">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-down pane-indicator"></div>
                    <h3 class="pane-header-title">Classes</h3>
                    <div class="actions">
                        <div class="monaco-toolbar">
                            <div class="monaco-action-bar">
                                <ul class="actions-container" role="toolbar" aria-label="delete actions">
                                    <li class="action-item menu-entry" role="presentation" custom-hover="true">
                                        <a class="action-label codicon codicon-add" role="button" aria-label="Add Class..." tabindex="0" id="add-class-button"></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="content classes-content" style="height: 100vh;">
                <div class="classes-list">

                </div>


            </div>
            
            <div class="pane vertical ids-pane">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-right pane-indicator"></div>
                    <h3 class="pane-header-title">IDs</h3>
                    <div class="actions">
                        <div class="monaco-toolbar">
                            <div class="monaco-action-bar">
                                <ul class="actions-container" role="toolbar" aria-label="delete actions">
                                    <li class="action-item menu-entry" role="presentation" custom-hover="true">
                                        <a class="action-label codicon codicon-add" role="button" aria-label="Add id..." tabindex="0" id="add-id-button"></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="content ids-content">

                    <div class="ids-list">
                        
                    </div>
                    <div class="divider">

                    </div>


            </div>
        </div>

       

        <script src="${mainScriptUri}" nonce="${nonce}"></script>

			
			</body>
			</html>`;
  }
}