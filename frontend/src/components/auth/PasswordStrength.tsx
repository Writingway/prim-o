// Password strength meter (4 segments) - pattern shared by the Register and Reset Password forms.
function score(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
}

const FILL = ['', 'bg-primo-error', 'bg-primo-warn', 'bg-primo-warn', 'bg-primo-success'];

export default function PasswordStrength({ value }: { value: string }) {
  const s = value ? score(value) : 0;
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-[5px] flex-1 rounded-[3px] ${i < s ? FILL[s] : 'bg-primo-line'}`}
        />
      ))}
    </div>
  );
}
