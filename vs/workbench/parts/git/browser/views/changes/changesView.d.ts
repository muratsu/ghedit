import 'vs/css!./changesView';
import EventEmitter = require('vs/base/common/eventEmitter');
import WinJS = require('vs/base/common/winjs.base');
import Builder = require('vs/base/browser/builder');
import Actions = require('vs/base/common/actions');
import Tree = require('vs/base/parts/tree/browser/tree');
import git = require('vs/workbench/parts/git/common/git');
import GitView = require('vs/workbench/parts/git/browser/views/view');
import GitActions = require('vs/workbench/parts/git/browser/gitActions');
import { IOutputService } from 'vs/workbench/parts/output/common/output';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IEventService } from 'vs/platform/event/common/event';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import IGitService = git.IGitService;
export declare class ChangesView extends EventEmitter.EventEmitter implements GitView.IView, GitActions.ICommitState {
    private configurationService;
    ID: string;
    private static COMMIT_KEYBINDING;
    private static NEED_MESSAGE;
    private static NOTHING_TO_COMMIT;
    private static LONG_COMMIT;
    private instantiationService;
    private editorService;
    private messageService;
    private contextViewService;
    private contextService;
    private gitService;
    private outputService;
    private $el;
    private $commitView;
    private $statusView;
    private commitInputBox;
    private tree;
    private visible;
    private currentDimension;
    private smartCommitAction;
    private actions;
    private secondaryActions;
    private actionRunner;
    private toDispose;
    constructor(actionRunner: Actions.IActionRunner, instantiationService: IInstantiationService, editorService: IWorkbenchEditorService, editorGroupService: IEditorGroupService, messageService: IMessageService, contextViewService: IContextViewService, contextService: IWorkspaceContextService, gitService: IGitService, outputService: IOutputService, eventService: IEventService, configurationService: IConfigurationService);
    element: HTMLElement;
    private render();
    focus(): void;
    layout(dimension?: Builder.Dimension): void;
    setVisible(visible: boolean): WinJS.TPromise<void>;
    private updateCommitInputTemplate();
    getControl(): Tree.ITree;
    getActions(): Actions.IAction[];
    getSecondaryActions(): Actions.IAction[];
    getCommitMessage(): string;
    onEmptyCommitMessage(): void;
    private onGitModelUpdate();
    private onEditorsChanged(input);
    private onSelection(e);
    private onGitOperationStart(operation);
    private onGitOperationEnd(e);
    private getStatusFromInput(input);
    dispose(): void;
}