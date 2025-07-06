export default function Card({ children, style = {}, ...props }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        padding: 24,
        margin: '16px 0',
        maxWidth: 600,
        width: '100%',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
} 
