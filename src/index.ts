import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILSPCodeExtractorsManager } from '@krassowski/jupyterlab-lsp';
import { ICodeMirror } from '@jupyterlab/codemirror';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import {
  cellMagicExtractor,
  markerExtractor,
  fsqlBlockExtractor,
  sqlCodeMirrorModesFor,
  registerCodeMirrorFor
} from './utils';
import CodeMirror from 'codemirror';

/*
Results in
LINE_MAGIC_EXTRACT
(?:^|\n)%sparksql(?: |-c|--cache|-e|--eager|-[a-z] [0-9a-zA-Z/._]+|--[a-zA-Z]+ [0-9a-zA-Z/._]+)*([^\n]*)
CELL_MAGIC_EXTRACT
(?:^|\n)%%sparksql(?: |-c|--cache|-e|--eager|-[a-z] [0-9a-zA-Z/._]+|--[a-zA-Z]+ [0-9a-zA-Z/._]+)*\n([^]*)
*/

/**
 * Code taken from https://github.com/jupyterlab/jupyterlab/blob/master/packages/codemirror/src/codemirror-ipython.ts
 * Modified to support embedded sql syntax
 */
function codeMirrorWithSqlSyntaxHighlightSupport(c: ICodeMirror) {
  /**
   * Define an IPython codemirror mode.
   *
   * It is a slightly altered Python Mode with a `?` operator.
   */
  registerCodeMirrorFor(c, 'fsql');

  c.CodeMirror.defineMode(
    'ipython',
    (config: CodeMirror.EditorConfiguration, modeOptions?: any) => {
      const pythonConf: any = {};
      for (const prop in modeOptions) {
        if (modeOptions.hasOwnProperty(prop)) {
          pythonConf[prop] = modeOptions[prop];
        }
      }
      pythonConf.name = 'python';
      pythonConf.singleOperators = new RegExp('^[\\+\\-\\*/%&|@\\^~<>!\\?]');
      pythonConf.identifiers = new RegExp(
        '^[_A-Za-z\u00A1-\uFFFF][_A-Za-z0-9\u00A1-\uFFFF]*'
      );
      //return c.CodeMirror.getMode(config, pythonConf);

      // Instead of returning this mode we multiplex it with SQL
      const pythonMode = c.CodeMirror.getMode(config, pythonConf);

      // get a mode for SQL
      const sqlMode = c.CodeMirror.getMode(config, 'fsql');
      // multiplex python with SQL and return it
      const multiplexedModes = sqlCodeMirrorModesFor('fsql', sqlMode);
      return c.CodeMirror.multiplexingMode(pythonMode, ...multiplexedModes);
    }
    // Original code has a third argument. Not sure why we don't..
    // https://github.com/jupyterlab/jupyterlab/blob/master/packages/codemirror/src/codemirror-ipython.ts
    // ,
    // 'python'
  );
}

/**
 * Initialization data for the jupyterlab_jc extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'fugue-jupyter:plugin',
  autoStart: true,
  optional: [],
  requires: [
    ICodeMirror,
    ILSPCodeExtractorsManager,
    ISettingRegistry,
    IEditorTracker,
    INotebookTracker
  ],
  activate: (
    app: JupyterFrontEnd,
    codeMirror: ICodeMirror,
    lspExtractorsMgr: ILSPCodeExtractorsManager,
    settingRegistry: ISettingRegistry,
    editorTracker: IEditorTracker,
    tracker: INotebookTracker
  ) => {
    /**
     * Load the settings for this extension
     *
     * @param setting Extension settings
     */
    /*function loadSetting(settings: ISettingRegistry.ISettings): void {
      // Read the settings and convert to the correct type
      const formatIndent = settings.get('formatIndent').composite as string;
      const formatUppercase = settings.get('formatUppercase').composite as boolean;
    }*/

    // Wait for the application to be restored and
    // for the settings for this plugin to be loaded
    /*Promise.all([app.restored, settingRegistry.load(Constants.SETTINGS_SECTION)])
      .then(([, settings]) => {
        // Read the settings
        loadSetting(settings);
        // Listen for your plugin setting changes using Signal
        settings.changed.connect(loadSetting);

      })
      .catch((reason) => {
        console.error(
          `Something went wrong when reading the settings.\n${reason}`
        );
      });*/

    // JupyterLab uses the CodeMirror library to syntax highlight code
    // within the cells. Register a multiplex CodeMirror capable of
    // highlightin SQL which is embedded in a IPython magic or within
    // a python string (delimited by markers)
    codeMirrorWithSqlSyntaxHighlightSupport(codeMirror);

    // JupyterLab-LSP relies on extractors to pull the SQL out of the cell
    // and into a virtual document which is then passed to the sql-language-server
    // for code completion evaluation
    lspExtractorsMgr.register(markerExtractor('fsql'), 'python');
    lspExtractorsMgr.register(fsqlBlockExtractor('fsql'), 'python');
    lspExtractorsMgr.register(cellMagicExtractor('fsql'), 'python');
    console.log('fugue-jupyter LSP extractors registered');
  }
};

export default plugin;
