export default function GoogleDriveIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -3 48 48"
      className={className}
      {...props}
    >
      <polygon fill="#3777E3" points="8.00048064 42 15.9998798 28 48 28 39.9998798 42"/>
      <polygon fill="#FFCF63" points="32.0004806 28 48 28 32.0004806 0 15.9998798 0"/>
      <polygon fill="#11A861" points="0 28 8.00048064 42 24 14 15.9998798 0"/>
    </svg>
  );
}
