"use client";

import { useEffect, useState } from "react";



export default function ImageCarousel({
  images,
}: {
  images: any[];
}) {
  const [current, setCurrent] = useState(0);
  const [showLarge, setShowLarge] = useState(false);



  // Auto swipe every 4 seconds
  useEffect(() => {
    if (!images || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [images]);


  if (!images || images.length === 0) {
    return (
      <div style={styles.noImage}>
        No Image
      </div>
    );
  }


  const nextImage = () => {
    setCurrent(
      current === images.length - 1
        ? 0
        : current + 1
    );
  };


  const prevImage = () => {
    setCurrent(
      current === 0
        ? images.length - 1
        : current - 1
    );
  };


  return (
    <div style={styles.container}>

      <img
        src={images[current].url}
        alt="Property"
        style={styles.image}
        onClick={() => setShowLarge(true)}
      />


      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            style={styles.left}
          >
            ‹
          </button>


          <button
            onClick={nextImage}
            style={styles.right}
          >
            ›
          </button>


          <div style={styles.dots}>
            {images.map((_:any,index:number)=>(
              <span
                key={index}
                onClick={()=>setCurrent(index)}
                style={{
                  ...styles.dot,
                  opacity:
                    current === index ? 1 : 0.4
                }}
              />
            ))}
          </div>
        </>
      )}
      {showLarge && (
        <div
          style={styles.overlay}
          onClick={() => setShowLarge(false)}
        >
          <img
            src={images[current].url}
            alt="Large"
            style={styles.largeImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}


const styles:any = {

container:{
  position:"relative",
  width:"100%",
  height:220,
  overflow:"hidden",
},


image:{
  width:"100%",
  height:"220px",
  objectFit:"cover",
  cursor: "zoom-in",
},


noImage:{
  height:220,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  background:"#E5E7EB",
  color:"#64748B",
},


left:{
  position:"absolute",
  left:10,
  top:"45%",
  background:"#000",
  color:"#fff",
  border:"none",
  borderRadius:"50%",
  width:35,
  height:35,
  cursor:"pointer",
},


right:{
  position:"absolute",
  right:10,
  top:"45%",
  background:"#000",
  color:"#fff",
  border:"none",
  borderRadius:"50%",
  width:35,
  height:35,
  cursor:"pointer",
},


dots:{
  position:"absolute",
  bottom:10,
  left:0,
  right:0,
  display:"flex",
  justifyContent:"center",
  gap:6,
},


dot: {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#fff",
  cursor: "pointer",
},

overlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
},

largeImage: {
  maxWidth: "95%",
  maxHeight: "90%",
  borderRadius: 12,
},


};
