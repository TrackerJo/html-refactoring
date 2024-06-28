// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { parseCSS, parseHTML } from './parser';
import { SidebarProvider } from './SidebarProvider';
import { GlobalStorageService } from './storage';

export type Attribute = {
	name: string;
	id: string;
	references: Array<Reference>;
	description: string;
};

type Reference = {
	filePath: string;
	line: number;
	start: number;
	end: number;

};

export type parsedAttribute = {
	name: string;
	value: string;
	start: number;
	end: number;
};

function generateId(){
	//Generate a random id with 16 characters with a mix of numbers and letters
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let pastLineNumber = 0;
	let currentLine = "";
	let currentID = "";
	let currentClass = "";
	let storageManager = new GlobalStorageService(context.globalState);

	const sidebarProvider = new SidebarProvider(context.extensionUri, storageManager);
	
	vscode.languages.registerHoverProvider('html', {

		provideHover(document, position, token) {

			return hoverProvider(document, position, token, storageManager);
		}
	});

	vscode.languages.registerHoverProvider('css', {
		
		provideHover(document, position, token) {

			return hoverProvider(document, position, token, storageManager);
		}
	});

	
	

	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("refactor-sidebar", sidebarProvider)
	);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "html-refactoring" is now active!');

	vscode.window.onDidChangeTextEditorSelection((e) => {

		console.log(e.selections[0]);
		//Check if line change
		if(e.selections[0].start.character == e.selections[0].end.character && e.selections[0].start.line == e.selections[0].end.line) {

			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const line = editor.selection.active.line;
				if (line !== pastLineNumber) {
					
					changedLines();
					pastLineNumber = line;
					
				}
				currentLine = editor.document.lineAt(line).text;
			}
		}

	});

	vscode.languages.registerCompletionItemProvider('html', {
		provideCompletionItems(document, position, token, context) {
			const ids: Attribute[] = storageManager.getValue(vscode.workspace.name! + "-ids") || [];
			const classes: Attribute[] = storageManager.getValue(vscode.workspace.name! + "-classes") || [];
			const completionItems: vscode.CompletionItem[] = [];
			ids.forEach((id) => {
				const item = new vscode.CompletionItem(id.name, vscode.CompletionItemKind.Variable);
				item.detail = "ID";
				item.documentation = id.description;
				completionItems.push(item);
			});
			classes.forEach((classN) => {
				const item = new vscode.CompletionItem(classN.name, vscode.CompletionItemKind.Variable);
				item.detail = "Class";
				item.documentation = classN.description;
				completionItems.push(item);
			});
			return completionItems;	
		}
	});

	vscode.languages.registerCompletionItemProvider('css', {
		provideCompletionItems(document, position, token, context) {
			const ids: Attribute[] = storageManager.getValue(vscode.workspace.name! + "-ids") || [];
			const classes: Attribute[] = storageManager.getValue(vscode.workspace.name! + "-classes") || [];
			const completionItems: vscode.CompletionItem[] = [];
			ids.forEach((id) => {
				const item = new vscode.CompletionItem(id.name, vscode.CompletionItemKind.Variable);
				item.detail = "ID";
				item.documentation = id.description;
				completionItems.push(item);
			});
			classes.forEach((classN) => {
				const item = new vscode.CompletionItem(classN.name, vscode.CompletionItemKind.Variable);
				item.detail = "Class";
				item.documentation = classN.description;
				completionItems.push(item);
			});
			return completionItems;	
		}
	});
	context.subscriptions.push(vscode.commands.registerCommand('html-refactoring.edit-description', async (args: {type: string, oldDescription: string, name: string}) => {
		const projectName = vscode.workspace.name;
		const newDescription = await vscode.window.showInputBox({value: args.oldDescription});
		if(newDescription){
			if(args.type === "ID"){
				const ids: Attribute[] = storageManager.getValue(projectName + "-ids") || [];
				const id = ids.find((id: { name: string; }) => {
					return id.name === args.name;
				});
				if(id){
					id.description = newDescription;
					storageManager.setValue(projectName + "-ids", ids);
					sidebarProvider._view?.webview.postMessage({type: "update-ids", ids: ids});
				}
			} else {
				const classes: Attribute[] = storageManager.getValue(projectName + "-classes") || [];
				const classN = classes.find((classN: { name: string; }) => {
					return classN.name === args.name;
				});
				if(classN){
					classN.description = newDescription;
					storageManager.setValue(projectName + "-classes", classes);
					sidebarProvider._view?.webview.postMessage({type: "update-classes", classes: classes});
				}
			}
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('html-refactoring.add-description', async (args: {type: string, name: string}) => {
		const projectName = vscode.workspace.name;
		const newDescription = await vscode.window.showInputBox({placeHolder: "Add a description for the attribute"});
		if(newDescription){
			if(args.type === "ID"){
				const ids: Attribute[] = storageManager.getValue(projectName + "-ids") || [];
				const id = ids.find((id: { name: string; }) => {
					return id.name === args.name;
				});
				if(id){
					id.description = newDescription;
					storageManager.setValue(projectName + "-ids", ids);
					sidebarProvider._view?.webview.postMessage({type: "update-ids", ids: ids});
				}
			} else {
				const classes: Attribute[] = storageManager.getValue(projectName + "-classes") || [];
				const classN = classes.find((classN: { name: string; }) => {
					return classN.name === args.name;
				});
				if(classN){
					classN.description = newDescription;
					storageManager.setValue(projectName + "-classes", classes);
					sidebarProvider._view?.webview.postMessage({type: "update-classes", classes: classes});
				}
			}
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('html-refactoring.openReference', async (args: {filePath: string, line: number, start: number, end: number}) => {
		//Decode the file path
		// filePath = decodeURIComponent(filePath);
		// console.log(filePath, "Line: " + line, "Start: " + start, "End: " + end);
		const document = await vscode.workspace.openTextDocument(args.filePath);
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(new vscode.Position(args.line,args.start), new vscode.Position(args.line, args.end));
	}));
	context.subscriptions.push(vscode.commands.registerCommand('html-refactoring.refactor', async () => {
		const editor = vscode.window.activeTextEditor!;
		
		const selection = editor.selection;
		const selectedLine = editor.document.lineAt(selection.active.line).text;
		const attributes = parseHTML(selectedLine);
		if(!attributes){
			vscode.window.showInformationMessage("No attributes found");
			return;
		}
		if(attributes.length === 0){
			vscode.window.showInformationMessage("No attributes found");
			return;
		}
		if(attributes.length === 1){
			const attribute = attributes[0];
			const type = attribute.name === 'id' ? 'ID' : 'Class';
			//Select the attribute
			editor.selection = new vscode.Selection(new vscode.Position(selection.active.line, attribute.start), new vscode.Position(selection.active.line, attribute.end));
			const newValue = await vscode.window.showInputBox({value: attribute.value});
			if(newValue){
				if(newValue !== attribute.value){
					if(type === "Class"){
						refactorClass(attribute, newValue);
					} else {
						refactorID(attribute, newValue);
					}
				}
			}
		} else {
			console.log(attributes);
			const id = attributes.find((attribute: { name: string; }) => {
				return attribute.name === 'id';
			});
			const classN = attributes.find((attribute: { name: string; }) => {
				return attribute.name === 'class';
			});
			//Check if selection is on an ID
			if(selection.active.character >= id!.start && selection.active.character <= id!.end){
				const newValue = await vscode.window.showInputBox({value: id!.value});
				if(newValue){
					if(newValue !== id!.value){
						refactorID(id!, newValue);
					}
				}
			}
			//Check if selection is on a class
			if(selection.active.character >= classN!.start && selection.active.character <= classN!.end){
				const newValue = await vscode.window.showInputBox({value: classN!.value});
				if(newValue){
					if(newValue !== classN!.value){
						refactorClass(classN!, newValue);
					}
				}
			}
			//otherwise show a quick pick
			const quickPick = await vscode.window.showQuickPick([
				{id: id!.value, label: "ID"},
				{id: classN!.value, label: "Class"}
			], {placeHolder: "Select attribute to refactor"});
			if(quickPick){
				const newValue = await vscode.window.showInputBox({value: quickPick.id});
				if(newValue){
					if(newValue !== quickPick.id){
						if(quickPick.label === "ID"){
							refactorID(id!, newValue);
						} else {
							refactorClass(classN!, newValue);
						}
					}
				}
			}
			
		}
		
	}));



	async function refactorClass(attribute: parsedAttribute, newValue: string){
		const projectName = vscode.workspace.name;
		const editor = vscode.window.activeTextEditor!;
		const selection = editor.selection;
		const classes: Attribute[] = storageManager.getValue(projectName + "-classes") || [];
		let classN = classes.find((classN: { name: string; }) => {
			return classN.name === attribute.value;
		});
		const newClasses = await refactor(classN!, newValue);
		//update classes with new class
		classN!.name = newClasses.name;
		classN!.references = newClasses.references;

		currentClass = newValue;
		currentLine = editor.document.lineAt(selection.active.line).text;

		storageManager.setValue(projectName + "-classes", classes);
		sidebarProvider._view?.webview.postMessage({type: "update-classes", classes: classes});
	}

	async function refactorID(attribute: parsedAttribute, newValue: string){
		const projectName = vscode.workspace.name;
		const editor = vscode.window.activeTextEditor!;
		const selection = editor.selection;
		const ids: Attribute[] = storageManager.getValue(projectName + "-ids") || [];
		let id = ids.find((id: { name: string; }) => {
			return id.name === attribute.value;
		})!;
		const newIds = await refactor(id, newValue);
		//update ids with new id
		id.name = newIds.name;
		id.references = newIds.references;
		currentID = newValue;
		currentLine = editor.document.lineAt(selection.active.line).text;


		storageManager.setValue(projectName + "-ids", ids);
	}

	async function changedLines(){

		const fileName = vscode.window.activeTextEditor?.document.fileName || "";
		const fileExtension = fileName?.split('.').pop();
		const editor = vscode.window.activeTextEditor;
		const projectName = vscode.workspace.name;
		let changedAttributes: parsedAttribute[] = [];

		if (fileExtension === 'html') {

			changedAttributes = parseHTML(currentLine);

			


		} else if(fileExtension === "css"){
			changedAttributes = parseCSS(currentLine);
			console.log(changedAttributes);
		}

		const classes: Attribute[] = storageManager.getValue(projectName + "-classes") || [];
		const ids:Attribute[] = storageManager.getValue(projectName + "-ids") || [];

		if(changedAttributes){
			
			for (let i = 0; i < changedAttributes.length; i++) {
				const attribute = changedAttributes[i];
				if (attribute.name === 'id') {
					//Check if ID changed
					
					if(currentID !== attribute.value && currentID !== ""){

						updateID(ids, currentID, fileName, pastLineNumber);
					}
					const id = ids.find((id: { name: string; }) => {
						return id.name === attribute.value;
					});
					if(id){

					

						//Check if reference already exists
						const refExists = id.references.some((ref: { filePath: string; line: number; start: number; end: number; }) => {
							return ref.filePath === fileName && ref.line === pastLineNumber;
						});
						if(!refExists){
							id.references.push({filePath: fileName, line: pastLineNumber, start: attribute.start, end: attribute.end});
						} else {
							//Update the reference
							const ref = id.references.find((ref: { filePath: string; line: number; start: number; end: number; }) => {
								return ref.filePath === fileName && ref.line === pastLineNumber;
							});

							if(ref){
								ref.start = attribute.start;
								ref.end = attribute.end;
							}

						}
							


					} else {
						if(attribute.value !== ""){
							ids.push({name: attribute.value, id: generateId(), description: "", references: [
								{
									filePath: fileName,
									line: pastLineNumber,
									start: attribute.start,
									end: attribute.end,
									
								}
							]});
						}
					}
					//Update the storage
					storageManager.setValue(projectName + "-ids", ids);
					//Update the sidebar
					sidebarProvider._view?.webview.postMessage({type: "update-ids", ids: ids});
					

							
							
	

					
				} else if (attribute.name === 'class') {
					if(currentClass !== attribute.value && currentClass !== ""){

						updateClass(classes, currentClass, fileName, pastLineNumber);
					}
					const classN = classes.find((classN: { name: string; }) => {
						return classN.name === attribute.value;
					});
					if(classN){

						

							//Check if reference already exists
							const refExists = classN.references.some((ref: { filePath: string; line: number; start: number; end: number; }) => {
								return ref.filePath === fileName && ref.line === pastLineNumber;
							});
							if(!refExists){
								classN.references.push({filePath: fileName, line: pastLineNumber, start: attribute.start, end: attribute.end});
							} else {
								//Update the reference
								const ref = classN.references.find((ref: { filePath: string; line: number; start: number; end: number; }) => {
									return ref.filePath === fileName && ref.line === pastLineNumber;
								});

								if(ref){
									ref.start = attribute.start;
									ref.end = attribute.end;
								}

							}
							


					} else {
						if(attribute.value !== ""){
							classes.push({name: attribute.value, id: generateId(),description: "", references: [
								{
									filePath: fileName,
									line: pastLineNumber,
									start: attribute.start,
									end: attribute.end
								}
							]});
						}
					}
					//Update the storage
					storageManager.setValue(projectName + "-classes", classes);
					//Update the sidebar
					sidebarProvider._view?.webview.postMessage({type: "update-classes", classes: classes});
					
				}
			}
		}

		if(fileExtension === "html"){
			//Get current line
			currentLine = editor!.document.lineAt(editor!.selection.active.line).text!;
			const newAttributes = parseHTML(currentLine);
			if(newAttributes){
				for (let i = 0; i < newAttributes.length; i++) {
					const attribute = newAttributes[i];
					if (attribute.name === 'id') {
						currentID = attribute.value;
					} else if (attribute.name === 'class') {
						currentClass = attribute.value;
					}
				}
			} else {
				currentID = "";
				currentClass = "";
			}
		} else if(fileExtension === "css"){
			//Get current line
			currentLine = editor!.document.lineAt(editor!.selection.active.line).text!;
			const newAttributes = parseCSS(currentLine);
			if(newAttributes){
				for (let i = 0; i < newAttributes.length; i++) {
					const attribute = newAttributes[i];
					if (attribute.name === 'id') {
						currentID = attribute.value;
					} else if (attribute.name === 'class') {
						currentClass = attribute.value;
					}
				}
			} else {
				currentID = "";
				currentClass = "";
			}
		}

	}


}

async function updateID(ids: Attribute[], currentID: string, fileName: string, pastLineNumber: number){
	//Find the ID in the storage
	const id = ids.find((id: { name: string; }) => {
		return id.name === currentID;
	});
	if(id){
		//Remove the reference from the storage
		const newIds = id.references.filter((ref: Reference) => {
			return ref.filePath !== fileName || ref.line !== pastLineNumber;
		});
		//If the ID has no more references, remove it from the storage
		if(newIds.length === 0){
			const newIds = ids.filter((id: Attribute) => {
				return id.name !== currentID;
			});
			ids = newIds;
		} else {
			//Update the references
			id.references = newIds;

		}



	}
}

async function updateClass(classes: Attribute[], currentID: string, fileName: string, pastLineNumber: number){
	//Find the ID in the storage
	const classN = classes.find((classN: { name: string; }) => {
		return classN.name === currentID;
	});
	if(classN){
		//Remove the reference from the storage
		const newClasses = classN.references.filter((ref: Reference) => {
			return ref.filePath !== fileName || ref.line !== pastLineNumber;
		});
		//If the ID has no more references, remove it from the storage
		if(newClasses.length === 0){
			const newClasses = classes.filter((classN: Attribute) => {
				return classN.name !== currentID;
			});
			classes = newClasses;
		} else {
			//Update the references
			classN.references = newClasses;

		}



	}
}

export async function refactor(list: Attribute, newValue: string){
	console.log(list);
	const oldTextDocument = vscode.window.activeTextEditor?.document;

	// for (const ref of list.references) {
	for (let index = 0; index < list.references.length; index++) {
		const ref = list.references[index];
	
	
	

		const changeEditor = await vscode.workspace.openTextDocument(ref.filePath);

		await vscode.window.showTextDocument(changeEditor!);

		const editor = vscode.window.activeTextEditor;

		if (editor) {
			await editor.edit((editBuilder) => {
				editBuilder.replace(new vscode.Range(new vscode.Position(ref.line, ref.start),new vscode.Position(ref.line, ref.end)), newValue);
			});
			list.references[index].end = list.references[index].start + newValue.length;

		}
	}

	list.name = newValue;

	await vscode.window.showTextDocument(oldTextDocument!);
	return list;


}

function hoverProvider(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, storageManager: GlobalStorageService){
	const range = document.getWordRangeAtPosition(position);
	let word = document.getText(range);
	//Cut off the # or . from the word
	if(word[0] === "#" || word[0] === "."){
		word = word.slice(1);
	}
	const projectName = vscode.workspace.name;
	const ids: Attribute[] = storageManager.getValue(projectName! + "-ids") || [];
	const id = ids.find((id: { name: string; }) => {
		return id.name === word;
	});

	if(id){
		//Check if position is within the range of the ID
		const filePath = document.fileName;
		
		const ref = id.references.find((ref: { filePath: string; line: number; start: number; end: number; }) => {
			return ref.filePath === filePath&& ref.line === position.line && position.character >= ref.start && position.character <= ref.end;
		});
		if(!ref){
			return;
		}
		let references = ``;
		
		

		for (let i = 0; i < id.references.length; i++) {
			const ref = id.references[i];
			//Shorten the file path based on the workspace folder
			const filePath = ref.filePath.split('/');
			//Get index of the workspace folder
			const index = filePath.indexOf(projectName!);
			//Get the rest of the path
			const rest = filePath.slice(index + 1).join('/');
			const args = {filePath: ref.filePath, line: ref.line, start: ref.start, end: ref.end};

			const command = vscode.Uri.parse(`command:html-refactoring.test?${encodeURIComponent(JSON.stringify(args))}`);
			references += `[${rest} Line: ${ref.line + 1}](${command})  \n`;


		}
		const editDescArgs = {type: "ID", oldDescription: id.description, name: id.name};
		const addDescArgs = {type: "ID", name: id.name};
		const editDescCommand = vscode.Uri.parse(`command:html-refactoring.edit-description?${encodeURIComponent(JSON.stringify(editDescArgs))}`);
		const addDescCommand = vscode.Uri.parse(`command:html-refactoring.add-description?${encodeURIComponent(JSON.stringify(addDescArgs))}`);
		const contents = new vscode.MarkdownString(`${id.description !== "" ? id.description + `  \n\n` : ``}<u>References</u>  \n${references} \n\n ${id.description !== "" ? `[Edit Description](${editDescCommand})  \n` : `[Add Desciption](${addDescCommand})  \n`}[Refactor](command:html-refactoring.refactor)`);
		contents.isTrusted = true;

		return new vscode.Hover(contents);
	} else {
		const classes: Attribute[] = storageManager.getValue(projectName! + "-classes") || [];
		const classN = classes.find((classN: { name: string; }) => {
			return classN.name === word;
		});
		if(classN){
			//Check if position is within the range of the ID
			const filePath = document.fileName;
			const ref = classN.references.find((ref: { filePath: string; line: number; start: number; end: number; }) => {
				return ref.filePath === filePath&& ref.line === position.line && position.character >= ref.start && position.character <= ref.end;
			});
			if(!ref){
				return;
			}
			let references = ``;
			
			

			for (let i = 0; i < classN.references.length; i++) {
				const ref = classN.references[i];
				//Shorten the file path based on the workspace folder
				const filePath = ref.filePath.split('/');
				//Get index of the workspace folder
				const index = filePath.indexOf(projectName!);
				//Get the rest of the path
				const rest = filePath.slice(index + 1).join('/');
				const args = {filePath: ref.filePath, line: ref.line, start: ref.start, end: ref.end};

				const command = vscode.Uri.parse(`command:html-refactoring.openReference?${encodeURIComponent(JSON.stringify(args))}`);
				references += `[${rest} Line: ${ref.line + 1}](${command})  \n`;


			}
			const editDescArgs = {type: "Class", oldDescription: classN.description, name: classN.name};
			const addDescArgs = {type: "Class", name: classN.name};
			const editDescCommand = vscode.Uri.parse(`command:html-refactoring.edit-description?${encodeURIComponent(JSON.stringify(editDescArgs))}`);
			const addDescCommand = vscode.Uri.parse(`command:html-refactoring.add-description?${encodeURIComponent(JSON.stringify(addDescArgs))}`);
			const contents = new vscode.MarkdownString(`${classN.description !== "" ? classN.description + `  \n\n` : ``}References  \n${references} \n\n ${classN.description !== "" ? `[Edit Description](${editDescCommand})  \n` : `[Add Desciption](${addDescCommand})  \n`}[Refactor](command:html-refactoring.refactor) `);
			contents.isTrusted = true;

			return new vscode.Hover(contents);
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
