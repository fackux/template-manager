import React from 'react';
import PropTypes from 'prop-types';

const TYPES = {
  mjml: {
    name: 'text_mjml',
    accept: '.mjml',
    label: 'Template (MJML)',
  },
  json: {
    name: 'json_file',
    accept: 'application/json',
    label: 'Data (JSON)',
  },
};
interface Props {
  type: 'mjml' | 'json';
  setFile: (path: string) => void;
  notFile: () => void;
}

const InputFile = ({ type, setFile, notFile }: Props) => {
  const handleChange = (e) => {
    if (e.target.files.length) {
      const { path } = e.target.files[0];
      setFile(path);
    } else {
      notFile();
    }
  };

  return (
    <div>
      <label htmlFor={TYPES[type].name}>{TYPES[type].label}</label>
      <input
        accept={TYPES[type].accept}
        name={TYPES[type].name}
        onChange={handleChange}
        type="file"
      />
    </div>
  );
};

InputFile.propTypes = {
  type: PropTypes.string.isRequired,
  setFile: PropTypes.func.isRequired,
  notFile: PropTypes.func.isRequired,
};

export default InputFile;
