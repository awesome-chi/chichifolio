'use client';

import { useState } from 'react';
import { Crown, X } from 'lucide-react';
import { useApp, C, mono, cardSt, inpSt, lblSt } from '@/components/AppContext';

const btnSt = (v?: string) => ({
  background: v === 'primary' ? C.accent : v === 'danger' ? 'transparent' : 'rgba(15,30,50,0.8)',
  color: v === 'primary' ? '#fff' : v === 'danger' ? C.loss : C.muted,
  border: v === 'danger' ? `1px solid #3a1020` : `1px solid ${C.border}`,
  borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .2s',
});

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-[300] backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full bg-[#0f1e32] border border-[#172a45] rounded-t-2xl sm:rounded-2xl p-6 sm:p-7 overflow-y-auto"
        style={{ maxWidth: 430, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-extrabold text-[17px] text-white">{title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition p-1"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UserFormModal({ existing = null, onSave, onClose }: any) {
  const [name, setName] = useState(existing?.name || '');
  const [pw, setPw] = useState('');
  const [isAdmin, setIsAdmin] = useState(existing?.isAdmin || false);
  const valid = name.trim() && (existing || pw.trim());
  return (
    <Modal title={existing ? '사용자 수정' : '사용자 추가'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lblSt}>이름</label>
          <input style={inpSt} value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" autoFocus />
        </div>
        <div>
          <label style={lblSt}>비밀번호{existing && <span style={{ color: C.subtle }}> (변경 시만 입력)</span>}</label>
          <input style={inpSt} type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder={existing ? '변경할 비밀번호' : '비밀번호 입력'} />
        </div>
        {!existing && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.muted }}>
            <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} />
            관리자 권한
          </label>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
        <button style={btnSt()} onClick={onClose}>취소</button>
        <button style={{ ...btnSt('primary'), opacity: valid ? 1 : 0.4 }}
          onClick={() => valid && onSave({ name: name.trim(), password: pw.trim() || null, isAdmin })}>
          {existing ? '저장' : '추가'}
        </button>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const { users, session, addUser, updateUser, deleteUser } = useApp();
  const [modal, setModal] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const me = users.find((u: any) => u.id === session?.userId);

  if (!me?.isAdmin) {
    return <div className="flex items-center justify-center py-20 text-slate-500">관리자 전용 페이지입니다</div>;
  }

  const saveUser = async (data: any, existing?: any) => {
    if (existing) {
      await updateUser(existing.id, { name: data.name, password: data.password || undefined });
    } else {
      await addUser({ name: data.name, password: data.password, isAdmin: !!data.isAdmin });
    }
    setModal(null);
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    setConfirmDelete(null);
  };

  return (
    <div style={cardSt}>
      <div className="flex justify-between items-center mb-5">
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>사용자 관리</div>
        {users.length < 5 && (
          <button style={{ ...btnSt('primary'), display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setModal({ type: 'add' })}>
            + 사용자 추가
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {users.map((u: any) => (
          <div key={u.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl"
            style={{ background: '#0a1829', border: `1px solid ${u.color}30` }}>
            <div className="rounded-full flex items-center justify-center font-extrabold shrink-0"
              style={{ width: 36, height: 36, background: `${u.color}15`, border: `2px solid ${u.color}40`, fontSize: 14, color: u.color }}>
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                {u.name}
                {u.isAdmin && <span className="flex items-center gap-1 text-[10px] text-amber-400"><Crown className="w-3 h-3" />관리자</span>}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{u.holdings.length}개 종목</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button style={{ ...btnSt(), padding: '4px 12px', fontSize: 12 }} onClick={() => setModal({ type: 'edit', user: u })}>수정</button>
              <button style={{ ...btnSt('danger'), padding: '4px 12px', fontSize: 12, border: `1px solid #2a1825` }}
                onClick={() => setConfirmDelete(u.id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {modal?.type === 'add' && <UserFormModal onClose={() => setModal(null)} onSave={(data: any) => saveUser(data)} />}
      {modal?.type === 'edit' && <UserFormModal existing={modal.user} onClose={() => setModal(null)} onSave={(data: any) => saveUser(data, modal.user)} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[300] backdrop-blur-md"
          onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 32px', maxWidth: 360, width: '90vw', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>사용자를 삭제하시겠습니까?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>이 작업은 되돌릴 수 없습니다. 해당 사용자의 모든 보유 종목도 함께 삭제됩니다.</div>
            <div className="flex gap-3 justify-center">
              <button style={{ ...btnSt(), padding: '10px 24px' }} onClick={() => setConfirmDelete(null)}>취소</button>
              <button style={{ ...btnSt('danger'), padding: '10px 24px', border: `1px solid ${C.loss}40` }} onClick={() => handleDelete(confirmDelete)}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
