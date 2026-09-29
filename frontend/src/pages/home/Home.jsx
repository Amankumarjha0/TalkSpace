import MessageContainer from "../../components/messages/MessageContainer";
import Header from "../../components/sidebar/Header";
import Sidebar from "../../components/sidebar/Sidebar";

const Home = () => {
  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden">
      <Header />
      <Sidebar />
      <MessageContainer />
    </div>
  );
};
export default Home;
