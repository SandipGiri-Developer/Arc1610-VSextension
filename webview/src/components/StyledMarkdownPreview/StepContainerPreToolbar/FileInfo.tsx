import { MouseEventHandler } from 'react';
import FileIcon from '../../FileIcon';
import { ToolTip } from '../../gui/Tooltip';

export interface FileInfoProps {
  filepath: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  range?: string;
}

export const FileInfo = ({ filepath, range, onClick }: FileInfoProps) => {
  const filename = filepath.split('/').pop() || filepath.split('\\').pop() || filepath;
  return (
    <ToolTip content={filepath}>
      <div onClick={onClick}>
        <div>
          <FileIcon height='20px' width='20px' filename={filepath} />
        </div>
        <span>
          {filename} {range && ` ${range}`}
        </span>
      </div>
    </ToolTip>
  );
};
