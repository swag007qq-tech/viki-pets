import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Произошла ошибка приложения',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught application error:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDF5EE] p-6 text-[#5B3B2A]">
          <div className="w-full max-w-md rounded-[28px] border-[1.5px] border-[#E4C9B6] bg-[#FCF0E7] p-6 text-center shadow-sm">
            <h1 className="text-[20px] font-semibold">Что-то пошло не так</h1>
            <p className="mt-2 text-[14px] text-[#8D654E]">
              Пожалуйста, обновите страницу. Если ошибка повторяется, проверьте настройки доступа.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 h-11 cursor-pointer rounded-full bg-[#9B735B] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#8C654E]"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
