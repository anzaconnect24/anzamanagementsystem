import { Card, Form, Button, Col, Row, Stack,Container, Image, ToastContainer, Toast } from 'react-bootstrap';
import Heading2 from '../widgets/heading2';
import { AiFillCheckCircle, AiFillCloseCircle } from 'react-icons/ai';


const FailureNotification = ({showError,setShowError,errorMessage}) => {
    return ( <div>
        <ToastContainer className='px-3 py-3' position='top-end' >
        <Toast show={showError} autohide  onClose={()=>setShowError(false)} >
          <Toast.Body>
            <Stack direction='horizontal'>
                  <AiFillCloseCircle size={20} color='red'/>
            <Heading2 className={"me-2"} text={errorMessage}/>

            </Stack>
            
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div> );
}

const SuccessNotification = ({showSuccess,setShowSuccess,successMessage}) => {
    return ( <div>
        <ToastContainer className='px-3 py-3' position='top-end' >
        <Toast show={showSuccess} autohide  onClose={()=>setShowSuccess(false)} >
          <Toast.Body>
            <Stack direction='horizontal'>
                  <AiFillCheckCircle size={20} color='green'/>
            <Heading2 className={"me-2"} text={successMessage}/>

            </Stack>
            
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div> );
}
 
export default FailureNotification;

