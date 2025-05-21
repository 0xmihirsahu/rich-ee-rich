export const allowedCharacters = [
    "B", "A", "R", "C", "D", "リ", "ス", "ト", "か", "ら", "R", "0", "1", "M",
    "L", "K", "J", "I", "H", "G", "F", "N", "O", "P", "Q", "R", "S", "T", "U",
    "V", "W", "X", "Y", "Z"
  ];
  
  export const getRandomCharacter = () =>
    allowedCharacters[Math.floor(Math.random() * allowedCharacters.length)];
  
  export const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
  };
  
  export const itemVariants = {
    hidden: { y: 50, opacity: 0, rotateX: -80 },
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    },
    hover: {
      scale: 1.05,
      rotateY: 5,
      transition: {
        duration: 0.2
      }
    }
  };