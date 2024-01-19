'use client';

import { pick } from 'lodash-es';
import JsonView from 'react18-json-view';
import { Editor, Transforms, createEditor, type Descendant } from 'slate';
import {
  Editable,
  Slate,
  useSlate,
  withReact,
  type ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
} from 'slate-react';

import 'react18-json-view/src/style.css';

interface CustomElement {
  type: 'paragraph' | 'code';
  children: CustomText[];
}

interface CustomText {
  text: string;
  bold?: boolean;
}

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const editor = withReact(createEditor());

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'A line of text in a paragraph.' }],
  },
];

const renderElement = (props: RenderElementProps) => {
  switch (props.element.type) {
    case 'code':
      return <CodeElement {...props} />;
    default:
      return <DefaultElement {...props} />;
  }
};

const renderLeaf = (props: RenderLeafProps) => <Leaf {...props} />;

export const SlateEditor = () => (
  <div className="flex flex-col gap-2">
    <Slate editor={editor} initialValue={initialValue}>
      <div>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            CustomEditor.toggleBoldMark(editor);
          }}
        >
          Bold
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            CustomEditor.toggleCodeBlock(editor);
          }}
        >
          Code Block
        </button>
      </div>

      <Editable
        className="p-2"
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={(event) => {
          if (!event.ctrlKey) {
            return;
          }

          switch (event.key) {
            case '`': {
              event.preventDefault();
              CustomEditor.toggleCodeBlock(editor);
              break;
            }

            case 'b': {
              event.preventDefault();
              CustomEditor.toggleBoldMark(editor);
              break;
            }
          }
        }}
      />

      <SlateDebugger />
    </Slate>
  </div>
);

const CodeElement = (props: RenderElementProps) => (
  <pre {...props.attributes}>
    <code>{props.children}</code>
  </pre>
);

const DefaultElement = (props: RenderElementProps) => (
  <p {...props.attributes}>{props.children}</p>
);

const Leaf = (props: RenderLeafProps) => (
  <span
    {...props.attributes}
    style={{ fontWeight: props.leaf.bold === true ? 'bold' : 'normal' }}
  >
    {props.children}
  </span>
);

const CustomEditor = {
  isBoldMarkActive(editor: Editor) {
    const marks = Editor.marks(editor);
    return marks?.bold ?? false;
  },

  isCodeBlockActive(editor: Editor) {
    const [match] = Editor.nodes(editor, {
      match: (n) => (n as CustomElement).type === 'code',
    });

    return match !== undefined;
  },

  toggleBoldMark(editor: Editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'bold');
    } else {
      Editor.addMark(editor, 'bold', true);
    }
  },

  toggleCodeBlock(editor: Editor) {
    const isActive = CustomEditor.isCodeBlockActive(editor);
    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : 'code' },
      { match: (n) => Editor.isBlock(editor, n as CustomElement) },
    );
  },
};

const SlateDebugger = () => {
  const editor = useSlate();

  if (editor.selection === null) {
    return null;
  }

  return (
    <>
      <JsonView src={pick(editor, ['children', 'selection'])} />
    </>
  );
};
