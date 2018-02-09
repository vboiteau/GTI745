
package mcguffin.android.simplewireframesketcher;


import java.util.ArrayList;
import java.util.HashMap;
import java.lang.Integer;
import android.view.MotionEvent;


class EventLogItem {
	public String description;
	public int count;

	public EventLogItem( String d ) {
		description = d;
		count = 1;
	}
}

public class EventLogger {
	public static EventLogger instance = null; // singleton

	private static final int MAX_NUM_ITEMS = 50;
	private static final int WINDOW_WIDTH = 700;
	private static final int WINDOW_HEIGHT = 1200;

	ArrayList< EventLogItem > items = new ArrayList< EventLogItem >();
	HashMap< Integer, Point2D > locations = new HashMap< Integer, Point2D >();

	public EventLogger() {
		instance = this;
	}
	
	public boolean hasMessages() { return ! items.isEmpty(); }
	
	private String generateDescription( MotionEvent event ) {
		String s = "";
		switch ( event.getActionMasked() ) {
		case MotionEvent.ACTION_DOWN :
			s = "DOWN";
			break;
		case MotionEvent.ACTION_POINTER_DOWN :
			s = "P_DOWN";
			break;
		case MotionEvent.ACTION_MOVE :
			s = "MOVE";
			break;
		case MotionEvent.ACTION_UP :
			s = "UP";
			break;
		case MotionEvent.ACTION_POINTER_UP :
			s = "P_UP";
			break;
		case MotionEvent.ACTION_HOVER_ENTER :
			s = "H_ENTER";
			break;
		case MotionEvent.ACTION_HOVER_EXIT :
			s = "H_EXIT";
			break;
		case MotionEvent.ACTION_HOVER_MOVE :
			s = "H_MOVE";
			break;
		case MotionEvent.ACTION_CANCEL :
			s = "CANCEL";
			break;
		case MotionEvent.TOOL_TYPE_ERASER :
			s = "ERASER";
			break;
		default:
			s = "?" + event.getActionMasked();
			break;
		}

		// With Samsung Galaxy Note 2, this gives us a value between 0.0 and 1.0
		s = s + "(t:" + event.getToolType(0) + "; b:"+ event.getButtonState() + "; z:" + event.getAxisValue(MotionEvent.AXIS_DISTANCE) + "; p:" + + event.getPressure() + "; o:" + event.getOrientation() + ")";

		s = s + "[" + event.getActionIndex() + "]";
		for ( int i = 0; i < event.getPointerCount(); ++i ) {
			int id = event.getPointerId(i);
			if ( i>0 ) s = s + ",";
			s = s + id;
			Point2D p = locations.get(new Integer(id));
			if ( p!=null && !p.equals(new Point2D(event.getX(i),event.getY(i))))
				s = s + "*";
		}
		
		// store locations to compare with them next time 
		locations.clear();
		for ( int i = 0; i < event.getPointerCount(); ++i ) {
			locations.put(
				new Integer(event.getPointerId(i)),
				new Point2D( event.getX(i), event.getY(i) )
			);
		}

		return s;
	}

	public void log( String message ) {
		int N = items.size();
		if ( N>0 && message.equals( items.get(N-1).description ) ) {
			items.get(N-1).count ++;
		}
		else {
			items.add( new EventLogItem( message ) );
			while ( items.size() > MAX_NUM_ITEMS )
				items.remove(0);
		}
	}
	public void log( MotionEvent e ) {
		log( generateDescription( e ) );
	}

	public void draw( GraphicsWrapper gw ) {
		gw.setColor( 0,0,0,0.3f );
		gw.fillRect( 5, 0, WINDOW_WIDTH-10, WINDOW_HEIGHT );
		gw.setColor( 1, 1, 1, 0.5f );
		int fontHeight = WINDOW_HEIGHT / (1+MAX_NUM_ITEMS);
		gw.setFontHeight( fontHeight );
		for ( int row = 0; row < items.size(); ++row ) {
			String d = items.get(row).description;
			int c = items.get(row).count;
			if ( c > 1 )
				d = d + "(x"+c+")";
			gw.drawString( 15, (row+1.5f)*fontHeight, d );
		}
	}
}

