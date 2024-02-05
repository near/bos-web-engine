import { useCallback, useState } from 'react';

import SetParent from './SetParent';
import ShapeSet from './ShapeSet';

interface Props {
  title: string;
}

export default function BWEComponent(props: Props) {
  const [circle, setCircle] = useState('circle');
  const [triangle, setTriangle] = useState('triangle');
  const [square, setSquare] = useState('square');

  const icons = [
    'alarm',
    'archive',
    'arrow-counterclockwise',
    'arrow-down-right-square-fill',
    'arrow-left-square-fill',
    'arrow-right-short',
    'arrow-up-right-square-fill',
    'arrows-move',
    'backspace-reverse-fill',
    'badge-cc',
    'badge-wc-fill',
    'bank',
    'basket3',
    'bezier2',
    'bookmark-check-fill',
    'bookmark-x-fill',
    'border-inner',
    'box-arrow-down-left',
    'box-arrow-left',
    'brightness-alt-high-fill',
    'bucket',
    'calendar-date',
    'calendar-plus',
    'calendar2-date',
    'calendar2-plus',
    'calendar3-fill',
    'camera-fill',
    'card-image',
    'caret-right',
    'cart-dash',
    'cash-coin',
    'chat-left-quote',
    'chat-right-quote-fill',
    'chat-text',
    'check2-circle',
    'chevron-compact-up',
    'clock',
    'cloud-download-fill',
    'cloud-haze-1',
    'cloud-plus',
    'cloud-snow-fill',
    'code-square',
    'cone',
    'crop',
    'cursor-fill',
    'diagram-2-fill',
    'dice-3-fill',
    'display-fill',
    'droplet-half',
    'emoji-dizzy',
    'emoji-neutral-fill',
    'envelope-open',
    'exclamation-octagon-fill',
    'eyeglasses',
    'file-break',
    'file-earmark-arrow-up',
    'file-earmark-code-fill',
    'file-earmark-image-fill',
    'file-earmark-pdf',
    'file-earmark-ppt-fill',
    'file-earmark-word',
    'file-font',
    'file-minus-fill',
    'file-post',
    'file-spreadsheet-fill',
    'film',
    'flower2',
    'folder2-open',
    'gear-wide',
    'gift',
    'grid-3x2',
    'hand-index-fill',
    'hdd-fill',
    'heart-fill',
    'hourglass-top',
    'inbox',
    'input-cursor-text',
    'journal-medical',
    'kanban',
    'layer-backward',
    'layout-text-sidebar-reverse',
    'lightning-charge',
    'list-task',
    'mastodon',
    'messenger',
    'moon-stars-fill',
    'music-player-fill',
    'option',
    'patch-exclamation-fill',
    'pause-circle-fill',
    'pentagon-half',
    'person-dash',
    'phone-landscape',
    'pin-fill',
    'plug',
    'printer',
    'question-octagon-fill',
    'record',
    'reply-all',
    'save-fill',
    'share-fill',
    'shield-lock-fill',
    'shuffle',
    'skip-backward-btn-fill',
    'skip-forward-btn',
    'skype',
    'snow3',
    'sort-up',
    'stack',
    'stop-btn-fill',
    'suit-diamond',
    'sunset',
    'tags',
    'telephone-outbound',
    'text-left',
    'thermometer-sun',
    'translate',
    'trophy-fill',
    'type-h1',
    'umbrella-fill',
    'vinyl-fill',
    'wallet',
    'window',
    'x-octagon-fill',
  ];

  const getRandomIcon = useCallback(
    () => icons[Math.floor(Math.random() * icons.length)],
    []
  );
  const updateCircle = useCallback(() => setCircle(getRandomIcon()), []);
  const updateSquare = useCallback(() => setSquare(getRandomIcon()), []);
  const updateTriangle = useCallback(() => setTriangle(getRandomIcon()), []);

  return (
    <div>
      <div className="col">
        <p>{props.title}</p>
      </div>
      <div className="col">
        <ShapeSet
          id="root-shapes"
          props={{
            circle,
            square,
            triangle,
            updateCircle,
            updateSquare,
            updateTriangle,
          }}
        />
        <SetParent
          id="parent-shapes"
          props={{
            id: 'parent-shapes',
            circle,
            square,
            triangle,
            updateCircle,
            updateSquare,
            updateTriangle,
          }}
        />
      </div>
    </div>
  );
}
