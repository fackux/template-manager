import React, { useState, useMemo } from 'react';
import { clipboard } from 'electron';
import ReactJson from 'react-json-view';
import Highlight from 'react-highlight';
import { ipcRenderer } from 'electron';
import Mustache from 'mustache';
import { IPCEvent } from './ipc/events';
import InputFile from './components/atoms/InputFile';
import CopyButton from './components/atoms/CopyButton';

const INIITAL_STATE = { json: {}, html: '' };

const App = () => {
  const [files, setFiles] = useState({ json: '', html: '' });

  const [state, setState] = useState(INIITAL_STATE);

  const [outputHtml, setOutputHtml] = useState('');

  const [viewRawHtml, setViewRawHtml] = useState(true);

  useMemo(() => {
    ipcRenderer.on(IPCEvent.JSON_UPDATE, (event, json) => {
      setState((s) => ({ ...s, json }));
    });

    ipcRenderer.on(IPCEvent.HTML_UPDATE, (event, html) => {
      setState((s) => ({ ...s, html }));
    });
  }, []);

  useMemo(() => {
    if (state.json.values && state.html !== '') {
      // Generar Render de Mustache
      const rendererTemplate = Mustache.render(state.html, state.json.values);
      setOutputHtml(rendererTemplate);
    }
  }, [state]);

  const notFile = () => {
    setOutputHtml('');
  };

  const setJsonFile = (path: string) => {
    setFiles({ ...files, json: path });
    ipcRenderer.send(IPCEvent.JSON_FILE, path);
  };

  const setHtmlFile = (path: string) => {
    setFiles({ ...files, html: path });
    ipcRenderer.send(IPCEvent.HTML_FILE, path);
  };

  const byteCount = (s: string) => {
    return (Buffer.byteLength(s, 'utf8') / 1024).toFixed(2);
  };

  const handleClickCopy = () => {
    clipboard.writeText(outputHtml);
    alert("HTML copiado al portapapeles!")
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          backgroundColor: 'black',
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          padding: '1rem 1.5rem 1rem 0.5rem',
          position: 'absolute',
          right: 0,
          top: 0,
          textAlign: 'right',
        }}
      >
        <div>
          <span style={{ fontSize: '1rem', color: 'cyan' }}>
            {byteCount(outputHtml)}
          </span>{' '}
          Kilobytes.
        </div>
        <div>
          <span style={{ fontSize: '1rem', color: 'pink' }}>
            {outputHtml.length}
          </span>{' '}
          Carácteres.
        </div>
      </div>

      <div style={{ display:'flex', alignItems: 'center'}}>
        <div style={{padding:'0px 10px'}}>
          <InputFile {...{ type: 'json', setFile: setJsonFile, notFile }} />
          <InputFile {...{ type: 'mjml', setFile: setHtmlFile, notFile }} />
        </div>

        <div style={{padding:'0px 10px'}}>
          <CopyButton handleClick={handleClickCopy} />
        </div>
      </div>

      <div>
        <input
          type="checkbox"
          checked={viewRawHtml}
          onChange={() => {
            setViewRawHtml(!viewRawHtml);
          }}
        />
        <span>Vista Previa</span>
      </div>

      <hr />
      {state.json !== {} && (
        <ReactJson
          src={state.json}
          name="JSON"
          displayDataTypes={false}
          quotesOnKeys={false}
          collapsed
        />
      )}
      <hr />
      <Highlight innerHTML={viewRawHtml} languages={['html']}>
        {outputHtml}
      </Highlight>
    </div>
  );
};

export default App;
