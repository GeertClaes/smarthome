export default function BilingualField({ label, en, de, onChangeEn, onChangeDe, multiline = false }) {
  const Input = multiline ? "textarea" : "input";

  return (
    <fieldset className="admin-bilingual-field">
      <legend className="admin-bilingual-label">{label}</legend>
      <label className="admin-field">
        <span>English</span>
        <Input value={en} onChange={(event) => onChangeEn(event.target.value)} rows={multiline ? 3 : undefined} />
      </label>
      <label className="admin-field">
        <span>German</span>
        <Input value={de} onChange={(event) => onChangeDe(event.target.value)} rows={multiline ? 3 : undefined} />
      </label>
    </fieldset>
  );
}
