"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createStaffCredential,
  setStaffPassword,
  setStaffUsername,
  setStaffPay,
  grantCreditToAll,
  toggleStaffActive,
  deleteStaffCredential,
  getLoginQr,
} from "./actions";
import { buildStaffCredentialsWhatsappUrl } from "@/lib/whatsapp";
import RoleIcon from "@/components/role-icon";
import type { StaffRole } from "@/lib/staff-session";
import { isActionError } from "@/lib/action-result";

type Account = {
  id: string;
  username: string;
  role: StaffRole;
  active: boolean;
  last_login_at: string | null;
  whatsapp_number: string | null;
  pay_cents: number;
  consumed_cents: number;
  net_pay_cents: number;
  credit_cents: number;
  credit_message: string | null;
};

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

const ROLE_LABEL: Record<StaffRole, string> = {
  puerta: "Puerta",
  caja: "Caja",
  mesero: "Mesero",
  dj: "DJ",
};

function randomPassword() {
  return Math.random().toString(36).slice(-8);
}

// Se muestra una sola vez, justo después de crear la cuenta o cambiar la
// contraseña: a diferencia del QR de una entrada, la contraseña no se
// guarda en texto plano, así que no se puede volver a mostrar más tarde.
function CredentialResult({
  eventId,
  username,
  role,
  password,
  initialPhone,
}: {
  eventId: string;
  username: string;
  role: StaffRole;
  password: string;
  initialPhone?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [copied, setCopied] = useState<"user" | "pass" | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const loginUrl = `${origin}/scan/${eventId}/acceso`;

  useEffect(() => {
    getLoginQr(loginUrl).then(setQrDataUrl);
  }, [loginUrl]);

  function copy(value: string, which: "user" | "pass") {
    navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-3 rounded-lg border border-lime-700 bg-lime-950/20 p-4">
      <p className="text-sm text-lime-300">
        Guardá esta contraseña ahora — no se puede volver a mostrar después.
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-400">Usuario:</span>
        <code className="rounded bg-neutral-900 px-2 py-1">{username}</code>
        <button
          onClick={() => copy(username, "user")}
          className="rounded-md border border-neutral-700 px-2 py-1 text-xs"
        >
          {copied === "user" ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-400">Contraseña:</span>
        <code className="rounded bg-neutral-900 px-2 py-1">{password}</code>
        <button
          onClick={() => copy(password, "pass")}
          className="rounded-md border border-neutral-700 px-2 py-1 text-xs"
        >
          {copied === "pass" ? "Copiado" : "Copiar"}
        </button>
      </div>

      {qrDataUrl && (
        <div className="flex items-center gap-4">
          <div className="w-fit rounded-xl bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR del link de acceso de staff" width={120} height={120} />
          </div>
          <a
            href={qrDataUrl}
            download={`qr-acceso-${role}.png`}
            className="text-sm text-neutral-400 underline"
          >
            Descargar QR
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp para enviar (opcional)"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        />
        {phone.trim() && (
          <a
            href={buildStaffCredentialsWhatsappUrl({ number: phone.trim(), role, username, password, loginUrl })}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-lime-500 px-3 py-2 text-sm font-medium text-neutral-950"
          >
            Enviar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function StaffAccountsClient({
  eventId,
  initialAccounts,
}: {
  eventId: string;
  initialAccounts: Account[];
}) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<StaffRole>("puerta");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [pay, setPay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<{
    username: string;
    role: StaffRole;
    password: string;
    phone: string;
  } | null>(null);

  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetResult, setResetResult] = useState<{
    id: string;
    username: string;
    role: StaffRole;
    password: string;
    phone: string;
  } | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [payId, setPayId] = useState<string | null>(null);
  const [payValue, setPayValue] = useState("");
  const [rowError, setRowError] = useState<string | null>(null);

  const [creditOpen, setCreditOpen] = useState(false);
  const [creditMessage, setCreditMessage] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditStatus, setCreditStatus] = useState<string | null>(null);

  function handleGrantCredit() {
    const amountCents = Math.round(Number(creditAmount.replace(",", ".")) * 100);
    if (!creditMessage.trim() || !amountCents || amountCents <= 0) return;
    setCreditStatus(null);
    startTransition(async () => {
      const res = await grantCreditToAll(eventId, creditMessage.trim(), amountCents);
      if (isActionError(res)) {
        setCreditStatus(res.error);
      } else {
        setCreditStatus(`Listo — se le dio crédito a ${res.count} cuenta${res.count === 1 ? "" : "s"} de staff`);
        setCreditMessage("");
        setCreditAmount("");
        setCreditOpen(false);
      }
      setTimeout(() => setCreditStatus(null), 4000);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError(null);
    setCreated(null);
    const payCents = Math.round(Number(pay.replace(",", ".")) * 100) || 0;
    startTransition(async () => {
      const res = await createStaffCredential(eventId, username.trim(), role, password, phone.trim(), payCents);
      if (isActionError(res)) {
        setError(res.error);
        return;
      }
      setCreated({ username: username.trim(), role, password, phone: phone.trim() });
      setUsername("");
      setPassword("");
      setPhone("");
      setPay("");
    });
  }

  function handleSetPay(account: Account) {
    const payCents = Math.round(Number(payValue.replace(",", ".")) * 100);
    if (Number.isNaN(payCents)) return;
    setRowError(null);
    startTransition(async () => {
      const res = await setStaffPay(account.id, eventId, payCents);
      if (isActionError(res)) {
        setRowError(res.error);
        return;
      }
      setPayId(null);
      setPayValue("");
    });
  }

  function handleResetPassword(account: Account) {
    if (!resetPassword) return;
    setRowError(null);
    startTransition(async () => {
      const res = await setStaffPassword(account.id, eventId, resetPassword);
      if (isActionError(res)) {
        setRowError(res.error);
        return;
      }
      setResetResult({
        id: account.id,
        username: account.username,
        role: account.role,
        password: resetPassword,
        phone: account.whatsapp_number ?? "",
      });
      setResetId(null);
      setResetPassword("");
    });
  }

  function handleDelete(account: Account) {
    if (!confirm(`¿Eliminar la cuenta "${account.username}"? Esta acción no se puede deshacer.`)) return;
    setRowError(null);
    startTransition(async () => {
      const res = await deleteStaffCredential(account.id, eventId);
      if (isActionError(res)) setRowError(res.error);
    });
  }

  function handleRename(account: Account) {
    if (!renameValue.trim()) return;
    setRowError(null);
    startTransition(async () => {
      const res = await setStaffUsername(account.id, eventId, renameValue.trim());
      if (isActionError(res)) {
        setRowError(res.error);
        return;
      }
      setRenameId(null);
      setRenameValue("");
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario (ej: caja1)"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-40 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setPassword(randomPassword())}
          className="rounded-md border border-neutral-700 px-3 py-2 text-sm"
        >
          Generar
        </button>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="w-40 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <input
          value={pay}
          onChange={(e) => setPay(e.target.value)}
          placeholder="Sueldo del evento (opcional)"
          inputMode="decimal"
          className="w-48 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-lime-500 px-4 py-2 font-medium text-neutral-950 disabled:opacity-50"
        >
          Crear cuenta
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {created && (
        <CredentialResult
          eventId={eventId}
          username={created.username}
          role={created.role}
          password={created.password}
          initialPhone={created.phone}
        />
      )}

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        {creditOpen ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">🎁 Dar crédito a todo el staff activo</p>
            <input
              value={creditMessage}
              onChange={(e) => setCreditMessage(e.target.value)}
              placeholder="Mensaje (ej: ¡Gracias por el esfuerzo, tomen algo de mi parte!)"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Monto por persona"
                inputMode="decimal"
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              />
              <button
                onClick={handleGrantCredit}
                disabled={isPending}
                className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
              >
                Enviar
              </button>
              <button
                onClick={() => setCreditOpen(false)}
                className="rounded-md border border-neutral-700 px-3 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreditOpen(true)} className="text-sm text-lime-400">
            🎁 Dar crédito a todo el staff activo
          </button>
        )}
      </div>
      {creditStatus && <p className="text-sm text-lime-400">{creditStatus}</p>}

      {rowError && <p className="text-sm text-red-400">{rowError}</p>}

      <div className="space-y-2">
        {initialAccounts.length === 0 && (
          <p className="text-neutral-400">Todavía no hay cuentas de staff para este evento.</p>
        )}
        {initialAccounts.map((account) => (
          <div key={account.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[180px] flex-1">
                <p className="font-medium">
                  <RoleIcon role={account.role} className="mr-1.5 inline h-4 w-4 -translate-y-0.5 text-lime-400" />
                  {account.username}{" "}
                  <span className="font-normal text-neutral-500">· {ROLE_LABEL[account.role]}</span>
                  {!account.active && <span className="ml-2 text-xs text-red-400">inactiva</span>}
                </p>
                <p className="text-xs text-neutral-600">
                  {account.last_login_at
                    ? `Último ingreso: ${new Date(account.last_login_at).toLocaleString("es-AR")}`
                    : "Nunca se usó para ingresar"}
                  {account.whatsapp_number && ` · WhatsApp: ${account.whatsapp_number}`}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Sueldo: {formatCents(account.pay_cents)} · Consumió: {formatCents(account.consumed_cents)} ·{" "}
                  <span className={account.net_pay_cents < 0 ? "text-red-400" : "text-lime-400"}>
                    Neto a pagar: {formatCents(account.net_pay_cents)}
                  </span>
                </p>
                {account.credit_cents > 0 && (
                  <p className="mt-1 text-xs text-amber-400">
                    🎁 Crédito de cortesía disponible: {formatCents(account.credit_cents)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setRenameId(renameId === account.id ? null : account.id);
                    setRenameValue(account.username);
                    setResetId(null);
                  }}
                  className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
                >
                  Cambiar usuario
                </button>
                <button
                  onClick={() => {
                    setResetId(resetId === account.id ? null : account.id);
                    setResetPassword("");
                    setRenameId(null);
                  }}
                  className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
                >
                  Cambiar contraseña
                </button>
                <button
                  onClick={() => {
                    setPayId(payId === account.id ? null : account.id);
                    setPayValue(String(account.pay_cents / 100));
                    setRenameId(null);
                    setResetId(null);
                  }}
                  className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
                >
                  Cambiar sueldo
                </button>
                <button
                  onClick={() =>
                    startTransition(() => {
                      void toggleStaffActive(account.id, eventId, !account.active);
                    })
                  }
                  className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
                >
                  {account.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  disabled={isPending}
                  className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-400 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {payId === account.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={payValue}
                  onChange={(e) => setPayValue(e.target.value)}
                  placeholder="Sueldo del evento"
                  inputMode="decimal"
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => handleSetPay(account)}
                  disabled={isPending}
                  className="rounded-md bg-lime-500 px-3 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            )}

            {renameId === account.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => handleRename(account)}
                  disabled={isPending}
                  className="rounded-md bg-lime-500 px-3 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            )}

            {resetId === account.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setResetPassword(randomPassword())}
                  className="rounded-md border border-neutral-700 px-3 py-2 text-sm"
                >
                  Generar
                </button>
                <button
                  onClick={() => handleResetPassword(account)}
                  disabled={isPending}
                  className="rounded-md bg-lime-500 px-3 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            )}

            {resetResult?.id === account.id && (
              <div className="mt-3">
                <CredentialResult
                  eventId={eventId}
                  username={resetResult.username}
                  role={resetResult.role}
                  password={resetResult.password}
                  initialPhone={resetResult.phone}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
