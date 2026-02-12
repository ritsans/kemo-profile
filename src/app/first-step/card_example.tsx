import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    id: 1,
    name: "username",
    title: "アカウント名を設定",
    placeholder: "ユーザー名を入力",
  },
  {
    id: 2,
    name: "bio",
    title: "プロフィールを記入",
    placeholder: "自己紹介を書いてください",
  },
  {
    id: 3,
    name: "interests",
    title: "興味のあるカテゴリ",
    placeholder: "例: デザイン / プログラミング",
  },
] as const;

type Direction = 1 | -1;

type FormState = {
  username: string;
  bio: string;
  interests: string;
};

export default function OnboardingCardSlider() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);

  // ✅ カードを切り替えても入力を保持するため、フォーム値はコンポーネント側で管理する
  const [form, setForm] = useState<FormState>({
    username: "",
    bio: "",
    interests: "",
  });

  const step = steps[index];

  const variants: Variants = useMemo(
    () => ({
      enter: (dir: Direction) => ({
        x: dir * 200,
        opacity: 0,
        scale: 0.99,
      }),
      center: {
        x: 0,
        opacity: 1,
        scale: 1,
      },
      exit: (dir: Direction) => ({
        x: dir * -200,
        opacity: 0,
        scale: 0.99,
      }),
    }),
    [],
  );

  const go = (nextIndex: number) => {
    if (nextIndex === index) return;
    if (nextIndex < 0 || nextIndex > steps.length - 1) return;
    setDirection(nextIndex > index ? 1 : -1);
    setIndex(nextIndex);
  };

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  const value = form[step.name];

  const onChange = (v: string) => {
    setForm((prevForm) => ({ ...prevForm, [step.name]: v }));
  };

  const isLast = index === steps.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md relative">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 42,
              mass: 0.8,
            }}
            className="will-change-transform"
          >
            <Card className="rounded-[28px] shadow-2xl">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {index + 1} / {steps.length}
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {step.title}
                  </h2>
                </div>

                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={step.placeholder}
                  className="w-full border rounded-2xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prev}
                    disabled={index === 0}
                    className="rounded-2xl"
                  >
                    戻る
                  </Button>
                  <Button
                    onClick={() => {
                      if (!isLast) {
                        next();
                        return;
                      }
                      // ✅ ここで送信（API呼び出し等）に置き換え可能
                      // eslint-disable-next-line no-console
                      console.log("onboarding form:", form);
                    }}
                    className="rounded-2xl"
                  >
                    {isLast ? "完了" : "次へ"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center mt-6 gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-transform duration-150 ${
                i === index ? "bg-primary scale-110" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
