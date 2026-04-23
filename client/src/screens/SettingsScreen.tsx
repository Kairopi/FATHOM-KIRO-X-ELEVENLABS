import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { SPRING_SNAPPY } from '@/lib/motion';
import { LENS_METADATA, ALL_LENSES } from '@/lib/lenses';
import { PRESET_VOICES } from '@/lib/voices';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function SettingsScreen() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const defaults = useStore((s) => s.defaults);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const setDefaultLens = useStore((s) => s.setDefaultLens);
  const setDefaultVoicePair = useStore((s) => s.setDefaultVoicePair);
  const setPlaybackSpeed = useStore((s) => s.setPlaybackSpeed);
  const logout = useStore((s) => s.logout);

  const handleLogout = () => { logout(); navigate('/auth', { replace: true }); };

  return (
    <div className="flex flex-col gap-12 w-full">
      <motion.h1 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-h1 text-[var(--text-primary)]"
      >
        Settings
      </motion.h1>

      {/* Defaults */}
      <Section title="Defaults">
        <Card label="Default Learning Lens">
          <div className="flex flex-wrap gap-2">
            {ALL_LENSES.map((lens) => {
              const meta = LENS_METADATA[lens];
              const isSelected = defaults.lens === lens;
              return (
                <motion.button key={lens} type="button" 
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.98 }} 
                  transition={SPRING_SNAPPY}
                  aria-label={`Set default lens to ${meta.name}`} aria-pressed={isSelected}
                  onClick={() => setDefaultLens(isSelected ? null : lens)}
                  className={cn('rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium border transition-all duration-300',
                    isSelected ? 'border-transparent' : 'border-[var(--border-primary)] hover:border-[var(--border-focus)]'
                  )}
                  style={isSelected
                    ? { backgroundColor: `${meta.accentColor}1F`, color: meta.accentColor, boxShadow: `0 0 0 1px ${meta.accentColor}80` }
                    : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
                  }
                >
                  {meta.name}
                </motion.button>
              );
            })}
          </div>
        </Card>
        <Card label="Default Voice Pair">
          <div className="flex flex-col gap-3">
            <VoiceSelect label="Explainer" value={defaults.voicePair.explainer.name}
              onChange={(name) => {
                const v = PRESET_VOICES.find((v) => v.name === name);
                if (v) setDefaultVoicePair({ ...defaults.voicePair, explainer: { voiceId: v.id, name: v.name } });
              }}
            />
            <VoiceSelect label="Learner" value={defaults.voicePair.learner.name}
              onChange={(name) => {
                const v = PRESET_VOICES.find((v) => v.name === name);
                if (v) setDefaultVoicePair({ ...defaults.voicePair, learner: { voiceId: v.id, name: v.name } });
              }}
            />
          </div>
        </Card>
      </Section>

      {/* Playback */}
      <Section title="Playback">
        <Card label="Playback Speed">
          <div className="flex flex-wrap gap-2">
            {SPEED_OPTIONS.map((speed) => {
              const isSelected = playbackSpeed === speed;
              return (
                <motion.button key={speed} type="button" 
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.98 }} 
                  transition={SPRING_SNAPPY}
                  aria-label={`Set playback speed to ${speed}x`} aria-pressed={isSelected}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={cn('rounded-[var(--radius-button)] px-4 py-2 text-xs font-medium border transition-all duration-300',
                    isSelected
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-lg shadow-[var(--accent-primary)]/20'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-focus)]'
                  )}
                >
                  {speed}×
                </motion.button>
              );
            })}
          </div>
        </Card>
      </Section>

      {/* Account */}
      <Section title="Account">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Display Name</span>
            <span className="text-sm text-[var(--text-primary)]">{user?.displayName ?? '-'}</span>
          </div>
          <div className="h-px bg-[var(--border-secondary)]" />
          <motion.button type="button" 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }} 
            transition={SPRING_SNAPPY}
            onClick={handleLogout} aria-label="Log out"
            className="self-start flex items-center gap-2.5 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-medium border border-[var(--border-primary)] text-[var(--error)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
            Log Out
          </motion.button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{title}</h2>
      {children}
    </section>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 flex flex-col gap-4">
      <span className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
    </div>
  );
}

function VoiceSelect({ label, value, onChange }: { label: string; value: string; onChange: (name: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium w-16 shrink-0 uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <motion.select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        aria-label={`Default ${label} voice`}
        className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] text-[var(--text-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] appearance-none cursor-pointer"
      >
        {PRESET_VOICES.map((v) => (
          <option key={v.id} value={v.name}>{v.name}, {v.description}</option>
        ))}
      </motion.select>
    </div>
  );
}
