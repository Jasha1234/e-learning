export default function Footer() {
  return (
    <footer className="bg-white border-t py-4 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} EduLearn Platform. All rights reserved.</p>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="text-sm text-gray-500 hover:text-primary">Privacy Policy</a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary">Terms of Service</a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}
