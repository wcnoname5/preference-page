import { useExperiment } from "./hooks/useExperiment";
import { SetupForm } from "./components/SetupForm";
import { Experiment } from "./components/Experiment";
import { Result } from "./components/Result";

// 取代原本的 Router：頁面狀態直接從 experiment state 推導。
export function App() {
  const exp = useExperiment();
  const { state } = exp;

  let content;
  if (!state) {
    content = <SetupForm onStart={exp.start} />;
  } else if (state.phase === "done" && state.result) {
    content = <Result result={state.result} onRestart={exp.reset} />;
  } else {
    content = (
      <Experiment
        state={state}
        onChoose={exp.choose}
        onNext={exp.next}
        onSlide={exp.slideTo}
        onConfirmSlider={exp.confirmSlider}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 font-sans leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">偏好測量實驗</h1>
      {content}
    </div>
  );
}
