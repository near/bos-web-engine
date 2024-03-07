import s from "./styles.module.css";
import { useCallback, useState } from "react";

import SetParent from "./SetParent";
import ShapeSet from "./ShapeSet";

interface Props {
  title: string;
}

  const icons = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function TrustTree(props: Props) {
  const [circle, setCircle] = useState("A");
  const [square, setSquare] = useState("B");
  const [triangle, setTriangle] = useState("C");

  const getRandomIcon = (currentIcon: string) => {
    const filteredIcons = icons.filter((icon) => icon !== currentIcon);
    const newIcon = filteredIcons[Math.floor(Math.random() * filteredIcons.length)];
    return newIcon;
  };

  const updateCircle = () => setCircle(getRandomIcon);
  const updateSquare = () => setSquare(getRandomIcon);
  const updateTriangle = () => setTriangle(getRandomIcon);

  return (
    <div className={s.wrapper}>
      <p>
        <b>{props.title}</b>
      </p>

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
          id: "parent-shapes",
          circle,
          square,
          triangle,
          updateCircle,
          updateSquare,
          updateTriangle,
        }}
      />
    </div>
  );
}

export default TrustTree as BWEComponent<Props>;
