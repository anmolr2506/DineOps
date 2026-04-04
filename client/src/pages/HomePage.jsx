import CinematicScroll from '../components/landing/CinematicScroll';
import CustomerLandingSection from '../components/landing/CustomerLandingSection';
import Login from './auth/Login';

const HomePage = () => {
    return (
        <div className="w-full bg-black">
            <CinematicScroll />
            <Login />
            <CustomerLandingSection />
        </div>
    );
};

export default HomePage;
