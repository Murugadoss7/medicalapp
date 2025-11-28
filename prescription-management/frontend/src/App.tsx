import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { store } from './store';
import { router } from './routes';
import { theme } from './theme';
import { useAppDispatch } from './hooks';
import { initializeAuth, setUser } from './store/slices/authSlice';
import { useGetCurrentUserQuery } from './store/api';
import { ToastProvider } from './components/common/Toast';

const AppInitializer = () => {
  const dispatch = useAppDispatch();

  // Initialize auth from localStorage
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Fetch current user if we have tokens
  const hasTokens = !!localStorage.getItem('access_token');
  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !hasTokens,
  });

  // Update user in Redux when fetched
  useEffect(() => {
    if (currentUser) {
      dispatch(setUser(currentUser));
    }
  }, [currentUser, dispatch]);

  return <RouterProvider router={router} />;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <AppInitializer />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
