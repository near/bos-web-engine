import { useState } from 'react';
import styled from 'styled-components';

import { FileExplorer } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';
import { Preview } from './Preview';
import { SidebarActions } from './SidebarActions';
import { PanelType } from '../types';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: min-content 14rem 1fr 1fr;
  width: 100%;

  > * {
    overflow: hidden;
  }

  &[data-expanded-panel='EDITOR'] {
    grid-template-columns: min-content 14rem 1fr 0px;
  }

  &[data-expanded-panel='PREVIEW'] {
    grid-template-columns: min-content 0px 0px 1fr;
  }
`;

export function Layout() {
  const [expandedPanel, setExpandedPanel] = useState<PanelType | null>(null);

  return (
    <Wrapper data-expanded-panel={expandedPanel ?? ''}>
      <SidebarActions
        expandedPanel={expandedPanel}
        onSelectExpandPanel={setExpandedPanel}
      />

      <FileExplorer />

      <MonacoEditor />

      <Preview />
    </Wrapper>
  );
}
