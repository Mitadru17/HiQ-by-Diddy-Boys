import React, { useRef } from "react";
import Crosshair from "../utils/Crosshair";
import InfiniteMenu from "../utils/InfiniteMenu";

function Next1() {
  const containerRef = useRef(null);
  const items = [
    {
        image: './Next/realtime.jpg',
        link: 'https://google.com/',
        title: 'Real-Time Interview',
        description: ''
      },
      {
        image: 'https://picsum.photos/400/400?grayscale',
        link: 'https://google.com/',
        title: 'Live Coaching',
        description: ''
      },
      {
        image: 'https://picsum.photos/500/500?grayscale',
        link: 'https://google.com/',
        title: 'Simulation Mode',
        description: ''
      },
      {
        image: 'https://picsum.photos/600/600?grayscale',
        link: 'https://google.com/',
        title: 'Summary & Report',
        description: ''
      }
  ];

  return (
    <div
      ref={containerRef}
      className="feature relative w-screen h-screen overflow-hidden"
    >
      {/* Crosshair (Full Screen) */}
      <Crosshair containerRef={containerRef} color="#000" />

      {/* Heading */}
      <h2 className="text-[100px] p-4 relative z-10">Features</h2>
      <div style={{ height: "600px", position: "relative", color : "white"}}>
        <InfiniteMenu items={items} />
      </div>
    </div>
  );
}

export default Next1;
