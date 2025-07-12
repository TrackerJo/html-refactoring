// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.



(function () {

    const addClassButton = document.getElementById("add-class-button");
    const addIdButton = document.getElementById("add-id-button");
    let classes = [];
    let ids = [];
    const classList = document.querySelector(".classes-list");
    const idList = document.querySelector(".ids-list");
    let projectName = "";

    document.addEventListener('DOMContentLoaded', function () {
        vscode.postMessage({
            type: 'get-classes'
        });
        vscode.postMessage({
            type: 'get-ids'
        });
        vscode.postMessage({
            type: 'get-project-name'
        });

    });

    addClassButton.addEventListener("click", function () {
        vscode.postMessage({
            type: 'add-class-prompt'

        });
    });

    addIdButton.addEventListener("click", function () {
        vscode.postMessage({
            type: 'add-id-prompt'

        });
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update-classes':
                classes = message.classes;
                renderClasses();
                break;

            case 'update-ids':
                ids = message.ids;
                renderIds();
                break;
            case 'update-project-name':
                projectName = message.projectName;
                break;

        }
    });


    function renderClasses() {
        classList.innerHTML = "";


        classes.forEach((classObject, index) => {
            //Update the todo id
            classObject.id = classes.indexOf(classObject) + 1;
            classes[classes.findIndex(x => x.id === classObject.id)] = classObject;

            const classItem = document.createElement('div');
            classItem.id = `class-${classObject.id}`;
            classItem.style.cursor = 'pointer';
            classItem.style.padding = '5px';
            classItem.style.fontSize = '14px';
            //Make grey border

            classItem.style.margin = '5px';

            //Make display flex
            classItem.style.display = 'flex';
            classItem.style.justifyContent = 'space-between';
            classItem.addEventListener('mouseover', function () {
                //Check if the hover div already exists
                if (classItem.querySelector('.snippet')) {
                    return;
                }
                const hoverDiv = document.createElement('div');
                hoverDiv.classList.add('snippet');
                if (classObject.description !== undefined && classObject.description === null && classObject.description.length !== 0) {
                    const description = document.createElement('p');
                    description.innerHTML = classObject.description;
                    description.style.overflowWrap = 'break-word';
                    description.style.fontSize = '14px';

                    hoverDiv.appendChild(description);
                    const breakD = document.createElement('br');
                    hoverDiv.appendChild(breakD);
                }
                const referencesDiv = document.createElement('div');
                referencesDiv.style.display = 'flex';
                referencesDiv.style.flexDirection = 'column';
                referencesDiv.style.width = '100%';

                const referencesTitle = document.createElement('p');
                referencesTitle.innerHTML = 'References';
                referencesTitle.style.fontSize = '14px';
                referencesTitle.style.textDecoration = 'underline';
                referencesDiv.appendChild(referencesTitle);
                classObject.references.forEach((reference) => {
                    const referenceText = document.createElement('a');
                    //Shorten the reference text
                    let referenceList = reference.filePath.split('/');
                    let projectIndex = referenceList.indexOf(projectName);
                    let filePath = referenceList.slice(projectIndex + 1);

                    referenceText.innerHTML = filePath.join('/') + ' Line: ' + (reference.line + 1);
                    referenceText.style.overflowWrap = 'break-word';

                    referenceText.style.fontSize = '12px';
                    referenceText.classList.add('ref');
                    referenceText.addEventListener('click', function () {
                        vscode.postMessage({
                            type: 'open-file',
                            filePath: reference.filePath,
                            line: reference.line,
                            start: reference.start,
                            end: reference.end
                        });
                    });
                    referencesDiv.appendChild(referenceText);

                });
                hoverDiv.appendChild(referencesDiv);

                hoverDiv.addEventListener('mouseout', function (e) {
                    if (e.relatedTarget.classList.contains('snippet') || e.relatedTarget.parentElement.classList.contains('snippet') || e.relatedTarget.parentElement.parentElement.classList.contains('snippet')) {
                        return;
                    }

                    classItem.parentElement.removeChild(hoverDiv);
                });
                classItem.insertAdjacentElement('afterend', hoverDiv);

            });
            classItem.addEventListener('mouseout', function (e) {
                //Check if the mouse is over the hover div
                if (e.relatedTarget.classList.contains('snippet') || e.relatedTarget.parentElement.classList.contains('snippet') || e.relatedTarget.parentElement.parentElement.classList.contains('snippet')) {
                    return;
                }

                const hoverDiv = classItem.parentElement.querySelector('.snippet');
                if (hoverDiv) {
                    classItem.parentElement.removeChild(hoverDiv);
                }
            });
            const classTextDiv = document.createElement('div');
            classTextDiv.style.width = '85%';
            classTextDiv.style.textWrap = 'wrap';



            const classText = document.createElement('p');
            classText.innerHTML = classObject.name;
            classText.style.overflowWrap = 'break-word';
            classTextDiv.appendChild(classText);

            classItem.appendChild(classTextDiv);
            const editButton = document.createElement('i');
            editButton.className = 'codicon codicon-pencil';
            editButton.style.width = '14px';
            editButton.style.height = '14px';
            editButton.style.float = 'right';
            editButton.style.cursor = 'pointer';
            editButton.style.margin = '5px';
            editButton.addEventListener('click', function () {
                vscode.postMessage({
                    type: 'edit-class-prompt',
                    index: index,
                });
            });
            classItem.appendChild(editButton);
            const deleteButton = document.createElement('i');
            deleteButton.className = 'codicon codicon-trash';
            deleteButton.style.width = '14px';
            deleteButton.style.height = '14px';
            deleteButton.style.float = 'right';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.margin = '5px';
            deleteButton.addEventListener('click', function () {
                classes = classes.filter(function (item) {
                    return item.id !== classObject.id;
                });
                renderClasses();
                saveClasses();
            });
            classItem.appendChild(deleteButton);




            classList.appendChild(classItem);
        });
    }

    function renderIds() {
        idList.innerHTML = "";

        ids.forEach((idObject, index) => {
            //Update the todo id
            idObject.id = ids.indexOf(idObject) + 1;
            ids[ids.findIndex(x => x.id === idObject.id)] = idObject;

            const idItem = document.createElement('div');
            idItem.id = `id-${idObject.id}`;
            idItem.style.cursor = 'pointer';
            idItem.style.padding = '5px';
            idItem.style.fontSize = '14px';
            //Make grey border

            idItem.style.margin = '5px';

            //Make display flex
            idItem.style.display = 'flex';
            idItem.style.justifyContent = 'space-between';
            const idTextDiv = document.createElement('div');
            idTextDiv.style.width = '85%';
            idTextDiv.style.textWrap = 'wrap';



            const idText = document.createElement('p');
            idText.innerHTML = idObject.name;
            idText.style.overflowWrap = 'break-word';
            idTextDiv.appendChild(idText);

            idItem.appendChild(idTextDiv);
            idItem.addEventListener('mouseover', function () {
                //Check if the hover div already exists
                if (idItem.querySelector('.snippet')) {
                    return;
                }
                const hoverDiv = document.createElement('div');
                hoverDiv.classList.add('snippet');
                if (idObject.description !== undefined && idObject.description === null && idObject.description.length !== 0) {
                    const description = document.createElement('p');
                    description.innerHTML = idObject.description;
                    description.style.overflowWrap = 'break-word';
                    description.style.fontSize = '14px';

                    hoverDiv.appendChild(description);
                    const breakD = document.createElement('br');
                    hoverDiv.appendChild(breakD);
                }
                const referencesDiv = document.createElement('div');
                referencesDiv.style.display = 'flex';
                referencesDiv.style.flexDirection = 'column';
                referencesDiv.style.width = '100%';

                const referencesTitle = document.createElement('p');
                referencesTitle.innerHTML = 'References';
                referencesTitle.style.fontSize = '14px';
                referencesTitle.style.textDecoration = 'underline';
                referencesDiv.appendChild(referencesTitle);
                idObject.references.forEach((reference) => {
                    const referenceText = document.createElement('a');
                    //Shorten the reference text
                    let referenceList = reference.filePath.split('/');
                    let projectIndex = referenceList.indexOf(projectName);
                    let filePath = referenceList.slice(projectIndex + 1);

                    referenceText.innerHTML = filePath.join('/') + ' Line: ' + (reference.line + 1);
                    referenceText.style.overflowWrap = 'break-word';

                    referenceText.style.fontSize = '12px';
                    referenceText.classList.add('ref');
                    referenceText.addEventListener('click', function () {
                        vscode.postMessage({
                            type: 'open-file',
                            filePath: reference.filePath,
                            line: reference.line,
                            start: reference.start,
                            end: reference.end
                        });
                    });
                    referencesDiv.appendChild(referenceText);

                });
                hoverDiv.appendChild(referencesDiv);

                hoverDiv.addEventListener('mouseout', function (e) {
                    if (e.relatedTarget.classList.contains('snippet') || e.relatedTarget.parentElement.classList.contains('snippet') || e.relatedTarget.parentElement.parentElement.classList.contains('snippet')) {
                        return;
                    }

                    idItem.parentElement.removeChild(hoverDiv);
                });
                idItem.insertAdjacentElement('afterend', hoverDiv);

            });
            idItem.addEventListener('mouseout', function (e) {
                //Check if the mouse is over the hover div
                if (e.relatedTarget.classList.contains('snippet') || e.relatedTarget.parentElement.classList.contains('snippet') || e.relatedTarget.parentElement.parentElement.classList.contains('snippet')) {
                    return;
                }

                const hoverDiv = idItem.parentElement.querySelector('.snippet');
                if (hoverDiv) {
                    idItem.parentElement.removeChild(hoverDiv);
                }
            });
            const editButton = document.createElement('i');
            editButton.className = 'codicon codicon-pencil';
            editButton.style.width = '14px';
            editButton.style.height = '14px';
            editButton.style.float = 'right';
            editButton.style.cursor = 'pointer';
            editButton.style.margin = '5px';
            editButton.addEventListener('click', function () {
                vscode.postMessage({
                    type: 'edit-id-prompt',
                    index: index,
                });
            });
            idItem.appendChild(editButton);
            const deleteButton = document.createElement('i');
            deleteButton.className = 'codicon codicon-trash';
            deleteButton.style.width = '14px';
            deleteButton.style.height = '14px';
            deleteButton.style.float = 'right';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.margin = '5px';
            deleteButton.addEventListener('click', function () {
                ids = ids.filter(function (item) {
                    return item.id !== idObject.id;
                });
                renderIds();
                saveIds();
            });
            idItem.appendChild(deleteButton);




            idList.appendChild(idItem);
        });
    }


    function saveClasses() {
        vscode.postMessage({
            type: 'save-classes',
            classes: classes
        });
    }

    function saveIds() {
        vscode.postMessage({
            type: 'save-ids',
            ids: ids
        });
    }



    const panes = document.querySelectorAll(".pane");

    for (let i = 0; i < panes.length; i++) {
        panes[i].addEventListener("click", function () {
            //Remove the active class from all panes
            const activePane = document.querySelector('.pane.active');
            if (activePane) {
                activePane.classList.remove('active');
                const indicator = activePane.querySelector('.pane-indicator');
                if (indicator.classList.contains('codicon-chevron-down')) {
                    indicator.classList.remove('codicon-chevron-down');
                    indicator.classList.add('codicon-chevron-right');

                } else {
                    indicator.classList.remove('codicon-chevron-right');
                    indicator.classList.add('codicon-chevron-down');

                }
                const content = activePane.nextElementSibling;
                if (content.style.height) {
                    content.style.height = null;
                } else {
                    content.style.height = "100vh";


                }
            }
            this.classList.toggle("active");
            const indicator = this.querySelector('.pane-indicator');

            if (indicator.classList.contains('codicon-chevron-down')) {
                indicator.classList.remove('codicon-chevron-down');
                indicator.classList.add('codicon-chevron-right');

            } else {
                indicator.classList.remove('codicon-chevron-right');
                indicator.classList.add('codicon-chevron-down');

            }
            const content = this.nextElementSibling;
            if (content.style.height) {
                content.style.height = null;
            } else {
                content.style.height = "100vh";
            }
        });
    }



}());