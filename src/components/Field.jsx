export default function Field({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true"> *</span>}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
