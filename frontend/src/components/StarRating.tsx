interface Props {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, readOnly }: Props) {
  return (
    <div className="stars" style={{ fontSize: '1.4rem', cursor: readOnly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange?.(n)}
          style={{ color: n <= value ? '#f59e0b' : '#d1d5db' }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
